import { useEffect, useMemo, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { downloadRunSummaries, summarizeRun, type RunTelemetry } from '../../utils/runTelemetry';
import { RunReplay } from '../common/RunReplay';
import { RunCharts } from '../common/RunCharts';
import { BuzzAnalysis } from '../common/BuzzAnalysis';
import { useEyeTracking } from '../../utils/useEyeTracking';
import { getRunReview } from '../../utils/runOutliers';
import { summarizeRunForOperator } from '../../utils/runSummary';

function measurement(value: number | null, unit: string, decimals = 0) {
  return value === null ? '—' : value.toFixed(decimals) + unit;
}

export function OperatorScreen({ cameraReady }: { cameraReady: boolean }) {
  const { pendingRuns, runsVersion, uploadRun, goToStep } = useArcade();
  const { status } = useArcadeController();
  const eye = useEyeTracking();
  const [savedRuns, setSavedRuns] = useState<Pick<RunTelemetry, 'id' | 'endedAt'>[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadedRun, setLoadedRun] = useState<RunTelemetry>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const runs = [...pendingRuns, ...savedRuns.filter((item) => !pendingRuns.some(({ id }) => id === item.id))];
  const currentId = runs.some(({ id }) => id === selectedId) ? selectedId : runs[0]?.id;
  const pendingRun = pendingRuns.find(({ id }) => id === currentId);
  const savedId = pendingRun ? undefined : currentId;
  const run = pendingRun ?? (loadedRun?.id === savedId ? loadedRun : undefined);
  const review = useMemo(() => run && getRunReview(run), [run]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    void fetch('/api/runs', { signal: controller.signal }).then(async (response) => {
      if (response.status === 405) throw new Error('Your run API is out of date. Restart it, then reload runs.');
      if (!response.ok) throw new Error('Could not load saved runs from Tiger Cloud.');
      const history = await response.json();
      if (!Array.isArray(history)) throw new Error('The run API returned an unexpected response.');
      if (!controller.signal.aborted) setSavedRuns(history);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setLoadError(error instanceof Error && error.name === 'Error'
        ? error.message : 'Could not load saved runs from Tiger Cloud.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [runsVersion, refresh]);

  useEffect(() => {
    setDetailError('');
    if (!savedId) return;
    const controller = new AbortController();
    void fetch(`/api/runs/${savedId}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error();
      const details = await response.json();
      if (!controller.signal.aborted) setLoadedRun(details);
    }).catch(() => {
      if (!controller.signal.aborted) setDetailError('Could not load this run.');
    });
    return () => controller.abort();
  }, [savedId, refresh]);

  async function deleteRun() {
    if (!savedId || !window.confirm('Permanently delete this run from Tiger Cloud?')) return;
    setDeleting(true);
    setActionError('');
    try {
      const response = await fetch(`/api/runs/${savedId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      setSavedRuns((previous) => previous.filter(({ id }) => id !== savedId));
      setLoadedRun(undefined);
      setSelectedId('');
      setRefresh((previous) => previous + 1);
    } catch {
      setActionError('Could not delete this run. Try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function exportRuns() {
    setExporting(true);
    setActionError('');
    try {
      const response = await fetch('/api/runs?full=1');
      if (!response.ok) throw new Error();
      const history: RunTelemetry[] = await response.json();
      downloadRunSummaries([...history, ...pendingRuns.filter(({ id }) => !history.some((item) => item.id === id))]);
    } catch {
      setActionError('Could not export saved runs. Try again.');
    } finally {
      setExporting(false);
    }
  }
  const stats = useMemo(() => run && summarizeRun(run), [run]);
  const observations = useMemo(() => run && stats && review
    ? summarizeRunForOperator(run, stats, review) : [], [run, stats, review]);
  const inputs = run ? [...new Set([...run.target.inputs, ...run.comet.inputs])] : [];
  const checks = [
    ['Eye tracker', eye.connected],
    ['Camera', cameraReady],
    [status.source === 'gamepad' ? 'USB gamepad' : 'Arduino', !!status.source],
    ['Joystick', status.joystick],
    ['Action button', status.button],
  ] as const;

  const metrics = run && stats ? [
    { label: 'Response', rows: [
      ['Median flash-to-click', 'Time from target appearance to a correct selection.', measurement(stats.median, ' ms')],
      ['Median flash-to-gaze', 'Time from the flash to the first live gaze sample entering the correct corner.', measurement(stats.gazeLatencyMedian, ' ms')],
      ['Median gaze-to-click', 'Time from that gaze sample to a correct selection.', measurement(stats.eyeToHandMedian, ' ms')],
      ['Correct selections', 'Correct selections out of all attempts.', `${stats.hits} / ${stats.shots}`],
      [run.target.game === 'odd-corners' ? 'Wrong-corner clicks' : 'Decoy hits', 'Selections on a distractor.', stats.decoys],
    ] },
    { label: 'Movement', rows: [
      ['Stars caught', 'Stars collected during the movement stage.', stats.stars],
      ...(run.comet.game === 'steady-path' ? [
        ['Mean off-trail deviation', 'Average distance beyond the trail edge, as a percentage of the arena diagonal.', measurement(stats.trailDeviation, '%', 1)],
        ['Joystick jitter', 'Short-term variation in the active stick signal, as a percentage of full axis range.', measurement(stats.joystickJitter, '%', 1)],
        ['Median gaze lead', 'How far gaze was ahead of or behind the ship, as a percentage of the trail length.', measurement(stats.eyeHandLead, '%', 1)],
      ] : [
        ['Path efficiency', 'Straight-line distance divided by distance traveled on completed chases.', measurement(stats.pathEfficiency, '%', 1)],
        ['Path deviation', 'Average distance from the direct route to the star, as a percentage of the arena diagonal.', measurement(stats.pathDeviation, '%', 1)],
        ['Mean heading change', 'Average turn angle between moving samples on completed chases.', measurement(stats.meanTurnDegrees, '°', 1)],
        ['Active stick change', 'Short-step changes while the joystick is displaced, as a percentage of full axis range.', measurement(stats.stickChange, '%', 1)],
      ]),
    ] },
    { label: 'Gaze', rows: [
      ['Visual focus rate', 'Share of gaze samples within the stage’s focus area.', measurement(stats.visualFocusPct, '%', 1)],
      ['Excessive gaze samples', 'Gaze samples flagged by the game for movement away from the target or trail.', stats.excessiveCount ?? '—'],
      ['Mean gaze error', 'Average distance from gaze to the active target, as a percentage of the arena diagonal.', measurement(stats.meanGazeDeviationPct, '%', 1)],
    ] },
  ] : [];
  const reviewRows = review ? ([
    ['Eye–hand separation', review.separation.flags],
    ['Off-trail deviation', review.deviation.flags],
    ['Flash-to-click time', review.response.flags],
  ] as const).flatMap(([label, flags]) => {
    const large = flags.filter((flag) => flag === 'large').length;
    const unusual = flags.filter((flag) => flag === 'unusual').length;
    return large || unusual ? [{ label, large, unusual }] : [];
  }) : [];
  const sections = [
    { id: 'history', label: 'Run history' },
    ...(run ? [
      { id: 'summary', label: 'Run recap' },
      { id: 'replay', label: 'Motion replay' },
      { id: 'graphs', label: 'Graphs' },
      { id: 'measurements', label: 'Measurements' },
    ] : []),
    { id: 'hardware', label: 'Hardware' },
  ];

  return (
    <section className="operator-screen">
      <header className="operator-panel-heading">
        <h1>Operator dashboard</h1>
        <div className="operator-actions">
          <button type="button" className="arcade-btn operator-action" data-accent="export" disabled={!runs.length || exporting}
            onClick={exportRuns}>{exporting ? 'Exporting…' : 'Export summary CSV'}</button>
          <button type="button" className="arcade-btn operator-action" data-accent="home" onClick={() => goToStep('start')}>Home</button>
        </div>
      </header>
      <div className="operator-layout">
        <nav className="operator-rail" aria-label="Operator sections">
          {sections.map(({ id, label }) => <a key={id} href={`#operator-${id}`} data-section={id}>{label}</a>)}
        </nav>
        <div className="operator-content">
          <section id="operator-history" data-section="history" className="operator-runbar operator-section" aria-label="Run history">
            <div className="operator-panel-heading">
              {runs.length > 0 && (
                <label>Run history <select value={currentId} disabled={deleting} onChange={(event) => {
                  setSelectedId(event.target.value);
                  setActionError('');
                }}>
                  {runs.map((item) => <option key={item.id} value={item.id}>
                    {new Date(item.endedAt).toLocaleString()} · {item.id.slice(0, 8)}
                  </option>)}
                </select></label>
              )}
              <div className="operator-actions">
                <button type="button" className="arcade-btn operator-action" data-accent="refresh" disabled={loading || deleting}
                  onClick={() => setRefresh((previous) => previous + 1)}>Refresh runs</button>
                {savedId && <button type="button" className="arcade-btn operator-action" data-accent="delete" disabled={deleting}
                  onClick={deleteRun}>{deleting ? 'Deleting…' : 'Delete run'}</button>}
                {pendingRun && <button type="button" className="arcade-btn operator-action" data-accent="retry"
                  onClick={() => uploadRun(pendingRun)}>Retry upload</button>}
              </div>
            </div>
            {(loadError || detailError || actionError) && <p role="alert">{loadError || detailError || actionError}</p>}
            {!runs.length && !loadError && <p>{loading ? 'Loading saved runs…' : 'Complete both missions to save a run.'}</p>}
            {savedId && !run && !detailError && <p role="status">Loading run from Tiger Cloud…</p>}
            {run && <p className="input-hint">{pendingRun ? 'Upload pending' : 'Saved in Tiger Cloud'}
              {' · '}Age band {run.ageGroup || 'unavailable'} · Input {inputs.join(' + ') || 'none recorded'}</p>}
          </section>
          {run && review && (
            <>
              <section id="operator-summary" data-section="summary" className="operator-run-summary operator-section" aria-label="Run recap">
                <h2>Run recap</h2>
                <ul>{observations.map((observation) => <li key={observation}>{observation}</li>)}</ul>
                <p className="input-hint">Gaze timing includes polling and network delay. This game cannot assess whether a child needs a specialist.</p>
                <details className="operator-care-note">
                  <summary>When to ask a healthcare provider</summary>
                  <p>If coordination or attention difficulties persist during everyday activities, at home or at school, bring those observations to your child’s primary care provider. They can help decide whether an assessment is appropriate. <a href="https://caringforkids.cps.ca/handouts/behavior-and-development/developmental-coordination-disorder" target="_blank" rel="noreferrer">Canadian Paediatric Society guidance</a></p>
                </details>
              </section>
              <div id="operator-replay" data-section="replay" className="operator-section"><RunReplay key={run.id} run={run} /></div>
              <div id="operator-graphs" data-section="graphs" className="operator-section"><RunCharts run={run} review={review} /></div>
              <section id="operator-measurements" data-section="measurements" className="operator-measurements operator-section">
                <h2>Run measurements</h2>
                <table>
                  <thead><tr><th scope="col">Measurement</th><th scope="col">Description</th><th scope="col">Value</th></tr></thead>
                  {reviewRows.length > 0 && <tbody>
                    <tr><th className="operator-metric-group" scope="rowgroup" colSpan={3}>Samples to review</th></tr>
                    {reviewRows.map(({ label, large, unusual }) => (
                      <tr key={label} data-review={large ? 'large' : 'unusual'}>
                        <th scope="row">{label}</th>
                        <td>Higher than most samples in this run. See the outlined points in the graph.</td>
                        <td><div className="run-review-counts">
                          {large > 0 && <span data-review="large">{large} large</span>}
                          {unusual > 0 && <span data-review="unusual">{unusual} unusual</span>}
                        </div></td>
                      </tr>
                    ))}
                  </tbody>}
                  {metrics.map(({ label, rows }) => (
                    <tbody key={label}>
                      <tr><th className="operator-metric-group" scope="rowgroup" colSpan={3}>{label}</th></tr>
                      {rows.map(([name, description, value]) => (
                        <tr key={name}><th scope="row">{name}</th><td>{description}</td><td>{value}</td></tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </section>
            </>
          )}
          <details id="operator-hardware" data-section="hardware" className="operator-disclosure operator-section">
            <summary>Hardware diagnostics</summary>
            <ul className="preflight-checks" aria-label="Equipment status">
              {checks.map(([label, ready]) => (
                <li key={label} data-ready={ready}>{label} <b>{ready ? 'Ready' : 'Waiting'}</b></li>
              ))}
            </ul>
            <BuzzAnalysis />
          </details>
        </div>
      </div>
    </section>
  );
}
