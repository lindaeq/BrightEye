import { useEffect, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { downloadRunSummaries, summarizeRun, type RunTelemetry } from '../../utils/runTelemetry';
import { RunReplay } from '../common/RunReplay';
import { BuzzAnalysis } from '../common/BuzzAnalysis';
import { useEyeTracking } from '../../utils/useEyeTracking';

function percent(value: number | null) {
  return value === null ? '—' : value.toFixed(1) + '%';
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
  const stats = run && summarizeRun(run);
  const inputs = run ? [...new Set([...run.target.inputs, ...run.comet.inputs])] : [];
  const checks = [
    ['Eye tracker', eye.connected],
    ['Camera', cameraReady],
    [status.source === 'gamepad' ? 'USB gamepad' : 'Arduino', !!status.source],
    ['Joystick', status.joystick],
    ['Action button', status.button],
  ] as const;

  return (
    <section className="operator-screen">
      <header className="operator-panel-heading">
        <h1>Operator dashboard</h1>
        <div className="operator-actions">
          <button type="button" className="arcade-btn alt" disabled={!runs.length || exporting}
            onClick={exportRuns}>Export summary CSV</button>
          <button type="button" className="arcade-btn alt" onClick={() => goToStep('start')}>Home</button>
        </div>
      </header>
      <div className="operator-columns">
        <div className="operator-main">
          <section className="operator-panel">
            <div className="operator-panel-heading">
              <h2>Run history</h2>
              {runs.length > 0 && (
                <label>Run <select value={currentId} disabled={deleting} onChange={(event) => {
                  setSelectedId(event.target.value);
                  setActionError('');
                }}>
                  {runs.map((item) => <option key={item.id} value={item.id}>
                    {new Date(item.endedAt).toLocaleString()} · {item.id.slice(0, 8)}
                  </option>)}
                </select></label>
              )}
              {savedId && <button type="button" className="arcade-btn alt" disabled={deleting}
                onClick={deleteRun}>{deleting ? 'Deleting…' : 'Delete run'}</button>}
              {pendingRun && <button type="button" className="arcade-btn alt"
                onClick={() => uploadRun(pendingRun)}>Retry upload</button>}
            </div>
            {(loadError || detailError) && <p role="alert">{loadError || detailError}{' '}
              <button type="button" className="arcade-btn alt" onClick={() => setRefresh((previous) => previous + 1)}>
                Reload runs
              </button>
            </p>}
            {actionError && <p role="alert">{actionError}</p>}
            {!runs.length && !loadError && <p>{loading ? 'Loading saved runs…' : 'Complete both missions to save a run.'}</p>}
            {savedId && !run && !detailError && <p>Loading replay…</p>}
          </section>
          {run && stats ? (
            <>
              <section className="operator-panel">
                <div className="operator-panel-heading">
                  <h2>Session measurements</h2>
                </div>
                <p className="input-hint">Age band {run.ageGroup || 'unavailable'} · Input {inputs.join(' + ') || 'none recorded'}</p>
                <dl className="operator-metrics">
                  <div><dt>Targets hit</dt><dd>{stats.hits} / {stats.shots} shots</dd></div>
                  <div><dt>{run.target.game === 'odd-corners' ? 'Wrong-corner clicks' : 'Decoy hits'}</dt><dd>{stats.decoys}</dd></div>
                  {run.target.game === 'odd-corners' && <div><dt>Median flash-to-gaze</dt><dd>{stats.gazeLatencyMedian === null ? '—' : Math.round(stats.gazeLatencyMedian) + ' ms'}</dd></div>}
                  <div><dt>Median target-to-hit</dt><dd>{stats.median === null ? '—' : Math.round(stats.median) + ' ms'}</dd></div>
                  <div><dt>Stars caught</dt><dd>{stats.stars}</dd></div>
                  {run.comet.game === 'steady-path' ? <>
                    <div><dt>Mean off-trail deviation</dt><dd>{percent(stats.trailDeviation)}</dd></div>
                    <div><dt>Joystick jitter</dt><dd>{percent(stats.joystickJitter)}</dd></div>
                    <div><dt>Median gaze lead</dt><dd>{percent(stats.eyeHandLead)}</dd></div>
                  </> : <>
                    <div><dt>Path efficiency</dt><dd>{percent(stats.pathEfficiency)}</dd></div>
                    <div><dt>Path deviation</dt><dd>{percent(stats.pathDeviation)}</dd></div>
                    <div><dt>Mean heading change</dt><dd>{stats.meanTurnDegrees === null ? '—' : stats.meanTurnDegrees.toFixed(1) + '°'}</dd></div>
                    <div><dt>Active stick change</dt><dd>{percent(stats.stickChange)}</dd></div>
                  </>}
                  <div><dt>Visual focus rate</dt><dd>{percent(stats.visualFocusPct)}</dd></div>
                  <div><dt>Excessive gaze samples</dt><dd>{stats.excessiveCount ?? '—'}</dd></div>
                  <div><dt>Mean gaze error</dt><dd>{percent(stats.meanGazeDeviationPct)}</dd></div>
                  <div><dt>Median eye-to-hand</dt><dd>{stats.eyeToHandMedian === null ? '—' : Math.round(stats.eyeToHandMedian) + ' ms'}</dd></div>
                </dl>
              </section>
              <RunReplay key={run.id} run={run} />
            </>
          ) : null}
          <BuzzAnalysis />
        </div>
        <aside className="operator-main">
          <section className="operator-panel">
            <h2>How to read this</h2>
            <ul className="measurement-notes">
              <li><b>Target-to-hit</b> measures time from the targets appearing to a correct selection. Flash-to-gaze uses the first live gaze sample that enters the correct corner.</li>
              <li><b>Off-trail deviation</b> measures distance beyond the trail edge as a percentage of the arena diagonal. <b>Joystick jitter</b> measures short-term changes in the active stick signal.</li>
              <li><b>Gaze lead</b> measures how far ahead of or behind the ship the player looked, as a percentage of the trail. Negative values mean gaze was behind.</li>
              <li><b>Path efficiency</b> compares straight-line distance to traveled distance. <b>Path deviation</b> measures distance off the line to the star as a percentage of the arena diagonal. These use completed chases with continuous steering. Pointer runs can jump between positions, so those path values are omitted.</li>
              <li><b>Mean heading change</b> measures how sharply the ship turns between moving samples on completed chases.</li>
              <li><b>Active stick change</b> measures short-step movement in the controller signal while the stick is displaced. It includes deliberate corrections and hardware noise.</li>
            </ul>
            <p>These measurements can help you review timing and steering within the game. Developmental coordination disorder assessment uses standardized motor tests and considers how a child manages everyday activities.
              {' '}<a href="https://doi.org/10.1111/dmcn.14132" target="_blank" rel="noreferrer">DCD clinical guidance</a>
            </p>
            <p className="input-hint">Saved runs include game telemetry and gaze coordinates when the eye tracker is connected. Camera video is never recorded.</p>
          </section>
          <section className="operator-panel">
            <h2>Hardware diagnostics</h2>
            <ul className="preflight-checks" aria-label="Equipment status">
              {checks.map(([label, ready]) => (
                <li key={label} data-ready={ready}>{label} <b>{ready ? 'Ready' : 'Waiting'}</b></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
