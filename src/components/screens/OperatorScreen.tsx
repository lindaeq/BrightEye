import { useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { downloadRunSummaries, summarizeRun } from '../../utils/runTelemetry';
import { RunReplay } from '../common/RunReplay';
import { BuzzAnalysis } from '../common/BuzzAnalysis';

function percent(value: number | null) {
  return value === null ? '—' : value.toFixed(1) + '%';
}

export function OperatorScreen({ cameraReady }: { cameraReady: boolean }) {
  const { recentRuns, goToStep } = useArcade();
  const { status } = useArcadeController();
  const [selectedId, setSelectedId] = useState(recentRuns[0]?.id);
  const run = recentRuns.find(({ id }) => id === selectedId);
  const stats = run && summarizeRun(run);
  const inputs = run ? [...new Set([...run.target.inputs, ...run.comet.inputs])] : [];
  const checks = [
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
          <button type="button" className="arcade-btn alt" disabled={!recentRuns.length}
            onClick={() => downloadRunSummaries(recentRuns)}>Export summary CSV</button>
          <button type="button" className="arcade-btn alt" onClick={() => goToStep('start')}>Home</button>
        </div>
      </header>
      <div className="operator-columns">
        <div className="operator-main">
          {run && stats ? (
            <>
              <section className="operator-panel">
                <div className="operator-panel-heading">
                  <h2>Session measurements</h2>
                  <label>Run <select value={run.id} onChange={(event) => setSelectedId(Number(event.target.value))}>
                    {recentRuns.map((item) => <option key={item.id} value={item.id}>#{item.id} · {new Date(item.endedAt).toLocaleTimeString()}</option>)}
                  </select></label>
                </div>
                <p className="input-hint">Age band {run.ageGroup || 'unavailable'} · Input {inputs.join(' + ') || 'none recorded'}</p>
                <dl className="operator-metrics">
                  <div><dt>Targets hit</dt><dd>{stats.hits} / {stats.shots} shots</dd></div>
                  <div><dt>Decoy hits</dt><dd>{stats.decoys}</dd></div>
                  <div><dt>Median target-to-hit</dt><dd>{stats.median === null ? '—' : Math.round(stats.median) + ' ms'}</dd></div>
                  <div><dt>Stars caught</dt><dd>{stats.stars}</dd></div>
                  <div><dt>Path efficiency</dt><dd>{percent(stats.pathEfficiency)}</dd></div>
                  <div><dt>Path deviation</dt><dd>{percent(stats.pathDeviation)}</dd></div>
                  <div><dt>Mean heading change</dt><dd>{stats.meanTurnDegrees === null ? '—' : stats.meanTurnDegrees.toFixed(1) + '°'}</dd></div>
                  <div><dt>Active stick change</dt><dd>{percent(stats.stickChange)}</dd></div>
                </dl>
              </section>
              <RunReplay key={run.id} run={run} />
            </>
          ) : <p className="operator-panel">Complete both missions to see a run here.</p>}
          <BuzzAnalysis />
        </div>
        <aside className="operator-main">
          <section className="operator-panel">
            <h2>How to read this</h2>
            <ul className="measurement-notes">
              <li><b>Target-to-hit</b> measures elapsed time from a round target appearing to a successful shot. Aiming and pressing are included.</li>
              <li><b>Path efficiency</b> compares straight-line distance to traveled distance. <b>Path deviation</b> measures distance off the line to the star as a percentage of the arena diagonal. These use completed chases with continuous steering. Pointer runs can jump between positions, so those path values are omitted.</li>
              <li><b>Mean heading change</b> measures how sharply the ship turns between moving samples on completed chases.</li>
              <li><b>Active stick change</b> measures short-step movement in the controller signal while the stick is displaced. It includes deliberate corrections and hardware noise.</li>
            </ul>
            <p>These measurements can help you review timing and steering within the game. Developmental coordination disorder assessment uses standardized motor tests and considers how a child manages everyday activities.
              {' '}<a href="https://doi.org/10.1111/dmcn.14132" target="_blank" rel="noreferrer">DCD clinical guidance</a>
            </p>
            <p className="input-hint">Up to 12 completed runs stay in this tab. Replay uses game positions and actions. Camera video is never recorded.</p>
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
