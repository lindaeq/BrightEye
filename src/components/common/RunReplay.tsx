import { useEffect, useState } from 'react';
import type { Mission, RunTelemetry } from '../../utils/runTelemetry';

const eventLabel = {
  'target-hit': 'Target hit',
  'decoy-hit': 'Decoy hit',
  miss: 'Shot missed',
  'star-caught': 'Star caught',
};

export function RunReplay({ run }: { run: RunTelemetry }) {
  const [mission, setMission] = useState<Mission>('target');
  const [offset, setOffset] = useState(0);
  const [playStart, setPlayStart] = useState<number | null>(null);
  const playing = playStart !== null;
  const { frames, events } = run[mission];
  const duration = frames[frames.length - 1]?.ms ?? 0;
  const durationMs = Math.ceil(duration);

  useEffect(() => {
    if (playStart === null) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.min(duration, performance.now() - playStart);
      setOffset(elapsed);
      if (elapsed >= duration) setPlayStart(null);
    }, 40);
    return () => window.clearInterval(timer);
  }, [playStart, duration]);

  function chooseMission(next: Mission) {
    setPlayStart(null);
    setOffset(0);
    setMission(next);
  }

  const nextIndex = frames.findIndex((frame) => frame.ms > offset);
  const index = nextIndex === -1 ? frames.length - 1 : Math.max(0, nextIndex - 1);
  const frame = frames[index];
  const trail = frames.slice(Math.max(0, index - 55), index + 1)
    .map(({ player }) => (player.x * 100).toFixed(2) + ',' + (player.y * 100).toFixed(2)).join(' ');
  const upcoming = events.findIndex((event) => event.ms > offset);
  const latestEvent = events[upcoming === -1 ? events.length - 1 : upcoming - 1];

  return (
    <section className="operator-panel replay-panel" aria-label="Gameplay replay">
      <div className="operator-panel-heading">
        <h2>Gameplay replay</h2>
        <div className="operator-actions">
          <button type="button" className="arcade-text-button" aria-pressed={mission === 'target'}
            onClick={() => chooseMission('target')}>Target lock</button>
          <button type="button" className="arcade-text-button" aria-pressed={mission === 'comet'}
            onClick={() => chooseMission('comet')}>Comet tunnel</button>
        </div>
      </div>
      {frame ? (
        <>
          <div className="replay-arena" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={trail} vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="replay-target" data-kind={frame.target.kind}
              style={{ left: frame.target.x * 100 + '%', top: frame.target.y * 100 + '%' }}>
              {frame.target.kind === 'star' ? '✦' : ''}
            </span>
            <span className="replay-player" style={{ left: frame.player.x * 100 + '%', top: frame.player.y * 100 + '%' }} />
          </div>
          <div className="replay-controls">
            <button type="button" className="arcade-btn alt" disabled={!duration} onClick={() => {
              if (playing) {
                setPlayStart(null);
              } else {
                const from = offset >= duration ? 0 : offset;
                setOffset(from);
                setPlayStart(performance.now() - from);
              }
            }}>{playing ? 'Pause' : offset >= duration ? 'Replay' : 'Play'}</button>
            <input type="range" min={0} max={durationMs} step={1} value={Math.min(durationMs, Math.round(offset))}
              aria-label="Replay position" aria-valuetext={(offset / 1000).toFixed(1) + ' seconds'}
              onChange={(event) => {
                setPlayStart(null);
                setOffset(Number(event.target.value));
              }} />
            <output>{(offset / 1000).toFixed(1)} / {(duration / 1000).toFixed(1)} s</output>
          </div>
          <p className="input-hint">
            Pink ring = player · Filled marker = target{latestEvent ? ' · ' + eventLabel[latestEvent.kind] : ''}
          </p>
          {frame.stick && <p className="input-hint">Stick position · X {frame.stick.x.toFixed(2)} · Y {frame.stick.y.toFixed(2)}</p>}
        </>
      ) : <p className="input-hint">This mission has no captured frames.</p>}
    </section>
  );
}
