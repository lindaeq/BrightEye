import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { playSound } from '../../utils/audio';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { PixelSprite } from '../common/PixelSprite';
import { shipHeading } from '../../utils/missionGames';

const beacons = [{ x: 29, y: 38 }, { x: 70, y: 67 }, { x: 77, y: 27 }];
type Position = { x: number; y: number };
const clamp = (value: number) => Math.max(7, Math.min(93, value));

export function HowToScreen() {
  const { nextStep } = useArcade();
  const { mouseMode } = useArcadeController();
  const field = useRef<HTMLDivElement>(null);
  const beaconRing = useRef<HTMLDivElement>(null);
  const ship = useRef({ x: 49, y: 54, heading: 0 });
  const [position, setPosition] = useState(ship.current);
  const [cleared, setCleared] = useState(0);
  const [feedback, setFeedback] = useState('');
  const beacon = beacons[cleared];
  useEffect(() => {
    if (beacon) return;
    const timer = window.setTimeout(nextStep, 650);
    return () => window.clearTimeout(timer);
  }, [beacon, nextStep]);
  function isAligned(point: Position) {
    const arena = field.current;
    const ring = beaconRing.current;
    if (!beacon || !arena || !ring) return false;
    const dx = (point.x - beacon.x) * arena.clientWidth / 100;
    const dy = (point.y - beacon.y) * arena.clientHeight / 100;
    return Math.hypot(dx, dy) <= ring.offsetWidth / 2;
  }
  function steerTo(point: Position) {
    const previous = ship.current;
    const bounds = field.current?.getBoundingClientRect();
    const dx = point.x - previous.x, dy = point.y - previous.y;
    if (!bounds || (!dx && !dy)) return;
    ship.current = { ...point, heading: shipHeading(dx, dy, bounds) };
    setPosition(ship.current);
  }
  const move = (x: number, y: number, seconds: number) => {
    steerTo({ x: clamp(ship.current.x + x * 34 * seconds), y: clamp(ship.current.y + y * 44 * seconds) });
  };
  const ping = (point: Position = ship.current) => {
    if (!beacon) return;
    if (isAligned(point)) {
      setCleared(cleared + 1);
      setFeedback('Beacon lit!');
      playSound('hit');
    } else {
      setFeedback(mouseMode ? 'Click inside the pink ring.' : 'Move onto the ring, then press again.');
      playSound('blip');
    }
  };
  useArcadeControls(move, () => ping());

  function pointerPosition(event: PointerEvent<HTMLDivElement>): Position {
    const arena = event.currentTarget;
    const bounds = arena.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left - arena.clientLeft) * 100 / arena.clientWidth),
      y: clamp((event.clientY - bounds.top - arena.clientTop) * 100 / arena.clientHeight),
    };
  }

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">FLIGHT SCHOOL</p><h1>Light the beacons</h1></div>
        <p className="beacon-count">{cleared} / {beacons.length}</p>
      </div>
      <p>{mouseMode ? 'Aim at a pink ring and click to light it.' : 'Steer into the pink ring, then press the action button.'}</p>
      <div ref={field} className="training-field" onPointerMove={(event) => {
        if (mouseMode) steerTo(pointerPosition(event));
      }} onPointerDown={(event) => {
        const point = pointerPosition(event);
        steerTo(point);
        if (mouseMode) ping(point);
      }}>
        {beacon && <div key={cleared} ref={beaconRing} className="beacon-ring" data-aligned={isAligned(position)}
          style={{ left: beacon.x + '%', top: beacon.y + '%' }} aria-hidden="true" />}
        <div className="training-ship" style={{ left: position.x + '%', top: position.y + '%' }} aria-hidden="true">
          <PixelSprite name="ship" size={5} style={{ transform: `rotate(${position.heading}deg)` }} />
        </div>
      </div>
      <div className="training-footer">
        <div><p role="status">{beacon ? feedback || 'Find the first beacon.' : 'All beacons lit. You’re cleared for launch!'}</p>
          <p className="input-hint">{mouseMode ? 'Move the pointer to aim · Click or tap to ping' : 'Joystick or arrows to steer · Action button or Space to ping · Tap the field to aim'}</p></div>
        {beacon && <button type="button" className="arcade-btn" onClick={() => ping()}>Ping beacon</button>}
      </div>
    </section>
  );
}
