import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { PixelSprite } from '../common/PixelSprite';
import { useArcade } from '../../context/ArcadeContext';
import { checkpoints, clampUnit, distractorSpots, projectOntoTrail, shipHeading, trail, trailDistance, trailHeight, trailPoints,
  trailRadius, trailWidth } from '../../utils/missionGames';
import { playSound } from '../../utils/audio';
import type { InputSource, Point } from '../../utils/runTelemetry';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { liveGaze, useEyeTracking } from '../../utils/useEyeTracking';
import { useMissionClock } from '../../utils/useMissionClock';
import { useMissionTrace } from '../../utils/useMissionTrace';

export function Mission2Screen() {
  const { completeComet, nextStep } = useArcade();
  const eye = useEyeTracking();
  const demoPoint = eye.demoMode ? liveGaze(eye) : null;
  const field = useRef<HTMLDivElement>(null);
  const ship = useRef(trail[0]);
  const captures = useRef(0);
  const steering = useRef<InputSource | undefined>(undefined);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ ...ship.current, heading: 0 });
  const [collected, setCollected] = useState(0);
  const [onTrail, setOnTrail] = useState(true);
  const [distractor, setDistractor] = useState<Point>();
  const visibleDistractor = useRef<Point | undefined>(undefined);

  const { markInput, event, finish } = useMissionTrace(() => {
    const eyePoint = liveGaze(eye);
    const hand = projectOntoTrail(ship.current);
    const gaze = eyePoint && projectOntoTrail(eyePoint);
    return {
      player: ship.current,
      target: { ...(checkpoints[captures.current] ?? trail[trail.length - 1]), kind: 'star' },
      eye: eyePoint,
      focused: !!gaze && gaze.distance <= trailRadius,
      saccade: !!gaze && eye.saccadeDetected,
      excessive: !!gaze && eye.saccadeDetected && gaze.distance > trailRadius * 2,
      distractor: visibleDistractor.current,
      trail: steering.current && captures.current < checkpoints.length ? {
        deviationPct: Math.max(0, hand.distance - trailRadius) / Math.hypot(trailWidth, trailHeight) * 100,
        eyeLeadPct: gaze && gaze.distance <= trailRadius * 2 && hand.distance <= trailRadius * 2
          ? (gaze.progress - hand.progress) * 100 : undefined,
        joystick: steering.current === 'joystick',
      } : undefined,
    };
  }, 'steady-path');

  const { timeLeft, deadline, endEarly } = useMissionClock(() => {
    completeComet(finish(), captures.current);
    playSound('win');
    nextStep();
  });

  useEffect(() => {
    let timer: number;
    let previousSpot = -1;
    function schedule() {
      timer = window.setTimeout(() => {
        if (performance.now() >= deadline.current) return;
        const count = distractorSpots.length;
        previousSpot = previousSpot < 0
          ? Math.floor(Math.random() * count)
          : (previousSpot + 1 + Math.floor(Math.random() * (count - 1))) % count;
        const next = distractorSpots[previousSpot];
        visibleDistractor.current = next;
        setDistractor(next);
        timer = window.setTimeout(() => {
          visibleDistractor.current = undefined;
          setDistractor(undefined);
          schedule();
        }, 220 + Math.random() * 320);
      }, 380 + Math.random() * 1500);
    }
    schedule();
    return () => window.clearTimeout(timer);
  }, [deadline]);

  function move(dx: number, dy: number, source: InputSource) {
    if (!deadline.current || performance.now() >= deadline.current || captures.current === checkpoints.length) return;
    const previous = ship.current;
    const next = { x: clampUnit(previous.x + dx), y: clampUnit(previous.y + dy) };
    if (next.x === previous.x && next.y === previous.y) return;
    steering.current = source;
    markInput(source);
    ship.current = next;
    const bounds = field.current?.getBoundingClientRect();
    setPosition((position) => ({ ...next, heading: bounds
      ? shipHeading(next.x - previous.x, next.y - previous.y, bounds) : position.heading }));
    setOnTrail(projectOntoTrail(next).distance <= trailRadius);
    if (trailDistance(next, checkpoints[captures.current]) <= trailRadius) {
      event({ kind: 'star-caught', source });
      captures.current++;
      setCollected(captures.current);
      if (captures.current === checkpoints.length) endEarly.current();
      else playSound('hit');
    }
  }

  useArcadeControls((x, y, seconds, source) => move(x * seconds * 0.27, y * seconds * 0.54, source));

  function dragShip(pointer: PointerEvent<HTMLDivElement>) {
    const previous = drag.current;
    if (!previous || previous.id !== pointer.pointerId) return;
    const bounds = pointer.currentTarget.getBoundingClientRect();
    move((pointer.clientX - previous.x) / bounds.width, (pointer.clientY - previous.y) / bounds.height, 'pointer');
    drag.current = { id: pointer.pointerId, x: pointer.clientX, y: pointer.clientY };
  }

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">MISSION 2</p><h1>Steady Path</h1></div>
        <p className="beacon-count">{timeLeft}s · {collected}/{checkpoints.length} stars</p>
      </div>
      <p>Follow the glowing trail and collect the stars in order.</p>
      <div ref={field} className="training-field steady-arena" aria-label="Spaceship trail"
        onPointerDown={(pointer) => {
          if (drag.current || pointer.button !== 0) return;
          pointer.currentTarget.setPointerCapture(pointer.pointerId);
          drag.current = { id: pointer.pointerId, x: pointer.clientX, y: pointer.clientY };
        }}
        onPointerMove={dragShip}
        onLostPointerCapture={(pointer) => { if (drag.current?.id === pointer.pointerId) drag.current = null; }}>
        <svg className="steady-trail" viewBox={`0 0 ${trailWidth} ${trailHeight}`} preserveAspectRatio="none" aria-hidden="true">
          <polyline className="steady-corridor" points={trailPoints} strokeWidth={trailRadius * 2} />
          <polyline className="steady-dots" points={trailPoints} />
        </svg>
        {checkpoints.map((star, index) => index >= collected && (
          <span key={index} className="steady-star" data-next={index === collected} aria-hidden="true"
            style={{ left: `${star.x * 100}%`, top: `${star.y * 100}%` }}>✦</span>
        ))}
        {distractor && <span className="steady-star steady-distractor" aria-hidden="true"
          style={{ left: `${distractor.x * 100}%`, top: `${distractor.y * 100}%` }}>✦</span>}
        {demoPoint && <span className="demo-gaze-marker" aria-hidden="true"
          style={{ left: `${demoPoint.x * 100}%`, top: `${demoPoint.y * 100}%` }} />}
        <div className="training-ship" data-in-path={onTrail} aria-hidden="true"
          style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}>
          <PixelSprite name="ship" size={6} style={{ transform: `rotate(${position.heading}deg)` }} />
        </div>
      </div>
      <div className="training-footer">
        <p className="input-hint">Use the joystick or arrows, or drag to steer.</p>
        <p role="status">{!onTrail ? 'Guide your ship back to the trail.' : ''}</p>
      </div>
    </section>
  );
}
