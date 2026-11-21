import { useEffect, useState, useMemo } from 'react';
import type { Mission, RunTelemetry, Point, TraceFrame } from '../../utils/runTelemetry';
import { corners, quadrant, trailPoints, trailWidth, trailHeight, trailRadius } from '../../utils/missionGames';

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
  const [showHandPath, setShowHandPath] = useState(true);
  const [showEyePath, setShowEyePath] = useState(true);
  const [showExcessive, setShowExcessive] = useState(true);
  const [fullTrail, setFullTrail] = useState(true); // Default to full trail so paths are immediately visible!

  const playing = playStart !== null;
  const { frames, events, game } = run[mission];
  const duration = frames[frames.length - 1]?.ms ?? 0;
  const durationMs = Math.ceil(duration);

  useEffect(() => {
    if (playStart === null) return;
    const timer = window.setInterval(() => {
      const elapsed = Math.min(duration, performance.now() - playStart);
      setOffset(elapsed);
      if (elapsed >= duration) setPlayStart(null);
    }, 33);
    return () => window.clearInterval(timer);
  }, [playStart, duration]);

  function chooseMission(next: Mission) {
    setPlayStart(null);
    setOffset(0);
    setMission(next);
  }

  const nextIndex = frames.findIndex((frame) => frame.ms > offset);
  const index = nextIndex === -1 ? frames.length - 1 : Math.max(0, nextIndex - 1);
  const frame = frames[index] || frames[0];

  // Slice history window for trails: either full run or last 75 frames
  const historySlice = fullTrail ? frames.slice(0, index + 1) : frames.slice(Math.max(0, index - 75), index + 1);

  // Hand / Crosshair trail (Pink)
  const handTrail = historySlice
    .map(({ player }) => (player.x * 100).toFixed(2) + ',' + (player.y * 100).toFixed(2))
    .join(' ');

  // Eye Gaze trail (Cyan)
  const eyeTrail = historySlice
    .filter((f) => f.eye && Number.isFinite(f.eye.x) && Number.isFinite(f.eye.y))
    .map(({ eye }) => (eye!.x * 100).toFixed(2) + ',' + (eye!.y * 100).toFixed(2))
    .join(' ');

  // Find most recent eye position for current scrubber position
  const currentEye: Point | null =
    frame?.eye ??
    frames
      .slice(0, index + 1)
      .reverse()
      .find((f) => f.eye)?.eye ??
    null;

  // Deduplicate excessive eye points so consecutive frames don't pile up into a sausage
  const dedupedExcessivePoints = useMemo(() => {
    const list: TraceFrame[] = [];
    let lastMarkerTime = -9999;
    let lastMarkerPoint: Point | null = null;

    for (const f of historySlice) {
      if (f.eye && f.excessive) {
        const timeDiff = f.ms - lastMarkerTime;
        const dist = lastMarkerPoint
          ? Math.hypot(f.eye.x - lastMarkerPoint.x, f.eye.y - lastMarkerPoint.y)
          : 1;

        // Emit marker if first excessive frame, or eye darted > 8% away, or > 400ms passed
        if (timeDiff > 400 || dist > 0.08) {
          list.push(f);
          lastMarkerTime = f.ms;
          lastMarkerPoint = f.eye;
        }
      }
    }
    return list;
  }, [historySlice]);

  const upcoming = events.findIndex((event) => event.ms > offset);
  const latestEvent = events[upcoming === -1 ? events.length - 1 : upcoming - 1];

  // Calculate mission-specific eye statistics
  const totalFramesWithEye = frames.filter((f) => f.eye).length;
  const focusedFramesCount = frames.filter((f) => f.eye && f.focused).length;
  const excessiveFramesCount = dedupedExcessivePoints.length;
  const focusScore = totalFramesWithEye > 0 ? Math.round((focusedFramesCount / totalFramesWithEye) * 100) : null;

  return (
    <section className="operator-panel replay-panel" aria-label="Gameplay and Eye-Tracking Replay">
      <div className="operator-panel-heading">
        <div>
          <h2>Motion Replay: Eye Tracking vs Hand Execution</h2>
          <p className="input-hint" style={{ marginTop: 4 }}>
            Visualizing millisecond gaze trajectory against required motor path.
          </p>
        </div>
        <div className="operator-actions">
          <button
            type="button"
            className="arcade-text-button"
            aria-pressed={mission === 'target'}
            onClick={() => chooseMission('target')}
          >
            {run.target.game === 'odd-corners' ? 'Odd-One-Out Corners' : 'Target Lock'}
          </button>
          <button
            type="button"
            className="arcade-text-button"
            aria-pressed={mission === 'comet'}
            onClick={() => chooseMission('comet')}
          >
            {run.comet.game === 'steady-path' ? 'Steady Path' : 'Comet Tunnel'}
          </button>
        </div>
      </div>

      {frame ? (
        <>
          {/* Dual-Stream Arena Container */}
          <div className="replay-arena" aria-hidden="true" style={{ position: 'relative', overflow: 'hidden' }}>
            {game === 'steady-path' && (
              <svg viewBox={`0 0 ${trailWidth} ${trailHeight}`} preserveAspectRatio="none">
                <polyline className="steady-corridor" points={trailPoints} style={{ strokeWidth: trailRadius * 2 }} />
                <polyline className="steady-dots" points={trailPoints} />
              </svg>
            )}
            {game === 'odd-corners' && corners.map((corner, index) => (
              <span key={corner.label} className="odd-corner" data-odd={quadrant(frame.target) === index}
                style={{ left: `${corner.x * 100}%`, top: `${corner.y * 100}%` }}>✦</span>
            ))}
            {frame.distractor && <span className="steady-star steady-distractor"
              style={{ left: `${frame.distractor.x * 100}%`, top: `${frame.distractor.y * 100}%` }}>✦</span>}
            {/* SVG Path Layer (Normalized 0-100 coordinates) */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              <defs>
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="#00E5FF" floodOpacity="0.8" />
                </filter>
                <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="0.8" floodColor="var(--pink)" floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Hand / Crosshair Path (Pink) */}
              {showHandPath && handTrail && (
                <polyline
                  points={handTrail}
                  vectorEffect="non-scaling-stroke"
                  stroke="var(--pink)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  filter="url(#pinkGlow)"
                />
              )}

              {/* Eye Tracking Gaze Path (Cyan Dashed) */}
              {showEyePath && eyeTrail && (
                <polyline
                  className="eye-trail"
                  points={eyeTrail}
                  vectorEffect="non-scaling-stroke"
                  stroke="#00E5FF"
                  strokeWidth="3.2"
                  strokeDasharray="6 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  filter="url(#cyanGlow)"
                  style={{ stroke: '#00E5FF !important' }}
                />
              )}
            </svg>

            {/* Target Marker (Where gaze and hand need to be) */}
            {game !== 'odd-corners' && <span
              className="replay-target"
              data-kind={frame.target.kind}
              style={{
                position: 'absolute',
                left: `${frame.target.x * 100}%`,
                top: `${frame.target.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 6,
              }}
            >
              {frame.target.kind === 'star' ? '✦' : ''}
            </span>}

            {/* Hand / Joystick Marker (Pink Ring) */}
            {showHandPath && (
              <div
                className="replay-player"
                style={{
                  position: 'absolute',
                  left: `${frame.player.x * 100}%`,
                  top: `${frame.player.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: '2.5px solid var(--pink)',
                  boxShadow: '0 0 10px var(--pink)',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 8,
                  pointerEvents: 'none',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--pink)' }} />
              </div>
            )}

            {/* Excessive / Unfocused Eye Jump Markers (Crisp HTML Circles, never stretched) */}
            {showExcessive &&
              dedupedExcessivePoints.map((pt, i) => (
                <div
                  key={i}
                  title={`Excessive Saccade Jump at ${(pt.ms / 1000).toFixed(1)}s`}
                  style={{
                    position: 'absolute',
                    left: `${pt.eye!.x * 100}%`,
                    top: `${pt.eye!.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 51, 102, 0.85)',
                    border: '2px solid #FF3366',
                    boxShadow: '0 0 10px #FF3366',
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 7,
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                </div>
              ))}

            {/* Live Eye Reticle Cursor (Always bright cyan, clearly identifying Gaze) */}
            {showEyePath && currentEye && (
              <div
                style={{
                  position: 'absolute',
                  left: `${currentEye.x * 100}%`,
                  top: `${currentEye.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: '2.5px solid #00E5FF',
                  backgroundColor: frame.excessive ? 'rgba(255, 51, 102, 0.25)' : 'rgba(0, 229, 255, 0.2)',
                  boxShadow: '0 0 16px #00E5FF',
                  display: 'grid',
                  placeItems: 'center',
                  zIndex: 10,
                  pointerEvents: 'none',
                  transition: playing ? 'none' : 'left 0.05s ease, top 0.05s ease',
                }}
              >
                {/* Center Pupil Dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#00E5FF',
                    boxShadow: '0 0 6px #00E5FF',
                  }}
                />

                {/* Saccade warning ring */}
                {frame.excessive && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: '50%',
                      border: '2px dashed #FF3366',
                      boxShadow: '0 0 8px #FF3366',
                    }}
                  />
                )}

                {/* Floating Identifier Label */}
                <span
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#00E5FF',
                    background: 'rgba(3, 1, 44, 0.9)',
                    padding: '1px 5px',
                    borderRadius: 3,
                    border: '1px solid #00E5FF',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.04em',
                  }}
                >
                  👁 GAZE {frame.excessive ? '⚠️' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Replay Scrubber Controls */}
          <div className="replay-controls" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="arcade-btn alt"
              disabled={!duration}
              onClick={() => {
                if (playing) {
                  setPlayStart(null);
                } else {
                  const from = offset >= duration ? 0 : offset;
                  setOffset(from);
                  setPlayStart(performance.now() - from);
                }
              }}
            >
              {playing ? 'Pause' : offset >= duration ? 'Replay' : 'Play'}
            </button>
            <input
              type="range"
              min={0}
              max={durationMs}
              step={1}
              value={Math.min(durationMs, Math.round(offset))}
              aria-label="Replay position"
              aria-valuetext={(offset / 1000).toFixed(1) + ' seconds'}
              onChange={(event) => {
                setPlayStart(null);
                setOffset(Number(event.target.value));
              }}
            />
            <output>{(offset / 1000).toFixed(1)} / {(duration / 1000).toFixed(1)} s</output>
          </div>

          {/* Interactive Chart Legend & Layer Toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginTop: 8, fontSize: '0.82rem' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showEyePath} onChange={(e) => setShowEyePath(e.target.checked)} />
              <span style={{ color: '#00E5FF', fontWeight: 600 }}>👁 Eye Gaze Path (Cyan Dashed)</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showHandPath} onChange={(e) => setShowHandPath(e.target.checked)} />
              <span style={{ color: 'var(--pink)', fontWeight: 600 }}>🕹 Hand / Joystick Path (Pink)</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={showExcessive} onChange={(e) => setShowExcessive(e.target.checked)} />
              <span style={{ color: '#FF3366', fontWeight: 600 }}>⚠️ Excessive Jumps (Red Dots)</span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={fullTrail} onChange={(e) => setFullTrail(e.target.checked)} />
              <span style={{ color: 'var(--ink)' }}>Show Full Path Trail</span>
            </label>
          </div>

          {/* Real-Time Frame Telemetry Inspection */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 8,
              marginTop: 12,
              padding: 10,
              background: 'rgba(3, 1, 44, 0.7)',
              border: '1px solid var(--line)',
              borderRadius: 4,
            }}
          >
            <div>
              <span style={{ color: 'var(--pink)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                Frame Eye State
              </span>
              <strong style={{ color: frame.excessive ? '#FF3366' : frame.focused ? '#00E5FF' : 'var(--ink)' }}>
                {frame.excessive ? '⚠️ Excessive / Distracted' : frame.focused ? '🎯 Locked on Target' : 'Searching / Tracking'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--pink)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                Visual Focus Score
              </span>
              <strong style={{ color: '#00E5FF' }}>
                {focusScore !== null ? `${focusScore}% Focus` : '100%'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--pink)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                Gaze Coordinates
              </span>
              <strong style={{ fontFamily: 'monospace', color: '#00E5FF' }}>
                {currentEye ? `X: ${(currentEye.x * 100).toFixed(0)}%, Y: ${(currentEye.y * 100).toFixed(0)}%` : 'No Gaze'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--pink)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                Excessive Deviations
              </span>
              <strong style={{ color: excessiveFramesCount > 0 ? '#FF3366' : '#439A86' }}>
                {excessiveFramesCount} jumps
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--pink)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                Event At Scrubber
              </span>
              <strong>{latestEvent
                ? game === 'odd-corners' && latestEvent.kind === 'decoy-hit' ? 'Wrong corner' : eventLabel[latestEvent.kind]
                : 'No event yet'}</strong>
            </div>
          </div>
        </>
      ) : (
        <p className="input-hint">This mission has no captured frames.</p>
      )}
    </section>
  );
}
