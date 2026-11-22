import { useLayoutEffect, useRef, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { clampUnit, corners, quadrant } from '../../utils/missionGames';
import { playSound } from '../../utils/audio';
import type { InputSource, Point } from '../../utils/runTelemetry';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { liveGaze, useEyeTracking } from '../../utils/useEyeTracking';
import { useMissionClock } from '../../utils/useMissionClock';
import { useMissionTrace } from '../../utils/useMissionTrace';

export function Mission1Screen() {
  const { m1Score, recordM1Hit, completeTarget, nextStep } = useArcade();
  const eye = useEyeTracking();
  const [round, setRound] = useState(() => ({ corner: Math.floor(Math.random() * corners.length) }));
  const [aim, setAim] = useState<Point>({ x: 0.5, y: 0.5 });
  const cursor = useRef(aim);
  const [feedback, setFeedback] = useState('');
  const timing = useRef({ shownAt: 0, gazeAt: null as number | null, lastGazeCorner: null as number | null,
    observedAt: -Infinity, answered: false });
  const gaze = liveGaze(eye);

  useLayoutEffect(() => {
    const previousGaze = liveGaze(eye);
    timing.current = { shownAt: performance.now(), gazeAt: null,
      lastGazeCorner: previousGaze ? quadrant(previousGaze, 0.05) : null,
      observedAt: eye.receivedAt, answered: false };
    // Start timing only when the next set of stars is committed.
  }, [round]);

  function observeGaze() {
    const trial = timing.current;
    if (eye.receivedAt <= trial.observedAt || eye.receivedAt < trial.shownAt) return;
    trial.observedAt = eye.receivedAt;
    if (!gaze) return;
    const zone = quadrant(gaze, 0.05);
    if (zone === round.corner && trial.lastGazeCorner !== zone && trial.gazeAt === null) {
      trial.gazeAt = eye.receivedAt;
    }
    trial.lastGazeCorner = zone;
  }

  useLayoutEffect(observeGaze);

  const { event, finish } = useMissionTrace(() => ({
    player: cursor.current,
    target: { ...corners[round.corner], kind: 'round' },
    eye: liveGaze(eye),
    focused: !!gaze && quadrant(gaze, 0.05) === round.corner,
    saccade: !!gaze && eye.saccadeDetected,
  }), 'odd-corners');

  const { timeLeft, deadline } = useMissionClock(() => {
    completeTarget(finish());
    playSound('win');
    nextStep();
  });

  function answer(selected: number | null, source: InputSource) {
    const now = performance.now();
    const trial = timing.current;
    if (!deadline.current || now >= deadline.current || trial.answered) return;
    trial.answered = true;
    const hit = selected === round.corner;
    event({
      kind: hit ? 'target-hit' : selected === null ? 'miss' : 'decoy-hit',
      source,
      latencyMs: hit ? Math.round(now - trial.shownAt) : undefined,
      gazeLatencyMs: trial.gazeAt === null ? undefined : Math.round(trial.gazeAt - trial.shownAt),
      eyeToHandMs: hit && trial.gazeAt !== null ? Math.round(now - trial.gazeAt) : undefined,
    });
    if (selected !== null) recordM1Hit(hit ? 'Round' : 'Square');
    else playSound('blip');
    setFeedback(hit ? 'You found it!' : selected === null ? 'Aim at a corner.' : 'Try the different color.');
    setRound({ corner: (round.corner + 1 + Math.floor(Math.random() * (corners.length - 1))) % corners.length });
  }

  useArcadeControls((x, y, seconds) => {
    const next = { x: clampUnit(cursor.current.x + x * 0.9 * seconds),
      y: clampUnit(cursor.current.y + y * 1.25 * seconds) };
    cursor.current = next;
    setAim(next);
  }, (source) => answer(quadrant(cursor.current, 0.10), source));

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">MISSION 1</p><h1>Odd-One-Out Corners</h1></div>
        <p className="beacon-count">{timeLeft}s · {m1Score} pts</p>
      </div>
      <p>Find the star with a different color. Select its corner.</p>
      <div className="training-field odd-arena" aria-label="Four star corners">
        {corners.map((corner, index) => (
          <button type="button" key={corner.label} className="odd-corner" data-odd={round.corner === index}
            aria-label={corner.label}
            onClick={(click) => {
              cursor.current = corner;
              setAim(corner);
              answer(index, click.detail === 0 ? 'keyboard' : 'pointer');
            }}
            style={{ left: `${corner.x * 100}%`, top: `${corner.y * 100}%` }}>✦</button>
        ))}
        {eye.demoMode && gaze && <span className="demo-gaze-marker" aria-hidden="true"
          style={{ left: `${gaze.x * 100}%`, top: `${gaze.y * 100}%` }} />}
        <div className="game-crosshair" aria-hidden="true" style={{ left: `${aim.x * 100}%`, top: `${aim.y * 100}%` }} />
      </div>
      <div className="training-footer">
        <p className="input-hint">Joystick or arrows to aim · Action button or Space to select · Click or tap a star</p>
        <p role="status">{feedback}</p>
      </div>
    </section>
  );
}
