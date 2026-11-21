import { useEffect, useState, type ChangeEvent } from 'react';
import { analyzeBuzzes, parseBuzzCapture } from '../../utils/buzzAnalysis';
import { useArcadeController } from '../../context/ArcadeController';

const display = (value: number | null) => value === null ? '—' : Math.round(value).toString();

export function BuzzAnalysis() {
  const { buzzLog, buzzesLogged, capturingBuzzes, canCaptureBuzzes, startBuzzCapture, stopBuzzCapture } = useArcadeController();
  useEffect(() => () => { void stopBuzzCapture().catch(() => {}); }, [stopBuzzCapture]);
  const [capture, setCapture] = useState<ReturnType<typeof parseBuzzCapture> | null>(null);
  const [error, setError] = useState('');
  const [metric, setMetric] = useState<'refixationMs' | 'breakMs'>('refixationMs');
  const rows = capture ? analyzeBuzzes(capture) : [];
  const plotMax = Math.max(100, ...rows.map((row) => Math.ceil((row[metric] ?? 0) / 100) * 100));

  async function readCapture(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setError('');
    setCapture(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Capture exceeds 8 MB.');
      setCapture(parseBuzzCapture(await file.text()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to read capture.');
    }
  }

  async function toggleCapture() {
    setError('');
    try {
      if (capturingBuzzes) await stopBuzzCapture();
      else await startBuzzCapture();
    } catch {
      setError('Could not send the buzzer command to the Arduino.');
    }
  }

  function readControllerLog() {
    const text = JSON.stringify(buzzLog.current);
    setError('');
    setCapture(parseBuzzCapture(text));
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'brighteyed-buzz-controller.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="operator-panel">
      <h2>Auditory response by buzz</h2>
      <p>Import a synchronized capture from a fixed-target test to compare gaze breaks, time to refixate, and stick changes. This is an exploratory view without clinical cutoffs.</p>
      <div className="operator-actions">
        <button type="button" className="arcade-btn alt" disabled={!canCaptureBuzzes && !capturingBuzzes}
          onClick={toggleCapture}>{capturingBuzzes ? 'Stop buzzer test' : 'Start buzzer test'}</button>
        <button type="button" className="arcade-btn alt" disabled={!buzzesLogged || capturingBuzzes}
          onClick={readControllerLog}>Review and download controller log</button>
      </div>
      <p className="input-hint" role="status">{capturingBuzzes ? 'Recording · ' : ''}{buzzesLogged} buzz events logged. Connect the updated controller to run a hardware test.</p>
      <label>Capture JSON <input type="file" accept=".json,application/json" onChange={readCapture} /></label>
      {error && <p className="setup-error" role="alert">{error}</p>}
      {capture && (
        <>
          <p className="input-hint">
            {capture.syncErrorMs === undefined ? 'No synchronized gaze provided. ' : 'Clock alignment uncertainty: ±' + capture.syncErrorMs + ' ms. '}
            {capture.buzzes.every((buzz) => buzz.acousticMs !== undefined) ? 'Measured acoustic onset used.' : 'Trials without an acoustic measurement use the tone command time.'}
          </p>
          <label>Plot <select value={metric} onChange={(event) => setMetric(event.target.value === 'breakMs' ? 'breakMs' : 'refixationMs')}>
            <option value="refixationMs">Time to refixate</option>
            <option value="breakMs">Time to break gaze</option>
          </select></label>
          {rows.some((row) => row[metric] !== null) ? (
            <div>
              <p>{metric === 'refixationMs' ? 'Refixation time' : 'Gaze break latency'} by buzz · 0–{plotMax} ms</p>
              <div className="buzz-chart" aria-hidden="true">
                {rows.map((row) => (
                  <div key={row.n}>
                    <div className="buzz-chart-track">
                      {row[metric] !== null && <span style={{ height: row[metric] / plotMax * 100 + '%' }} />}
                    </div>
                    <small>#{row.n}</small>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="input-hint">No measured values available for this plot.</p>}
          <div className="buzz-table">
            <table>
              <caption className="sr-only">Per-buzz timing and stick change</caption>
              <thead><tr><th>Buzz</th><th>Command (µs)</th><th>Gaze outcome</th><th>Break (ms)</th><th>Refixation (ms)</th><th>Stick before / after</th></tr></thead>
              <tbody>{rows.map((row) => (
                <tr key={row.n}>
                  <td>{row.n}</td><td>{row.t_buzz}</td><td>{row.outcome}</td><td>{display(row.breakMs)}</td>
                  <td>{display(row.refixationMs)}</td><td>{display(row.stickBefore)} / {display(row.stickAfter)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="input-hint">Break is measured from onset. Refixation is measured from gaze departure to the start of a sustained return. Stick change compares 200 ms before and after onset in controller units.</p>
        </>
      )}
    </section>
  );
}
