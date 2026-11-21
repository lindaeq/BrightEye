import { useState, type PointerEvent } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { playSound } from '../../utils/audio';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { PixelSprite } from '../common/PixelSprite';

const beacons = [{ x: 29, y: 38 }, { x: 70, y: 67 }, { x: 77, y: 27 }];
type Position = { x: number; y: number };
const clamp = (value: number) => Math.max(7, Math.min(93, value));

export function HowToScreen() {
  const { nextStep } = useArcade();
  const { mouseMode } = useArcadeController();
  const [position, setPosition] = useState({ x: 49, y: 54 });
  const [cleared, setCleared] = useState(0);
  const [feedback, setFeedback] = useState('');
  const beacon = beacons[cleared];
  const isAligned = (point: Position) => !!beacon && Math.hypot((point.x - beacon.x) / 7, (point.y - beacon.y) / 9) <= 1;
  const move = (x: number, y: number, seconds: number) => {
    setPosition((previous) => ({ x: clamp(previous.x + x * 48 * seconds), y: clamp(previous.y + y * 68 * seconds) }));
  };
  const ping = (point = position) => {
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
  useArcadeControls(move, ping);

  function pointerPosition(event: PointerEvent<HTMLDivElement>): Position {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) * 100 / bounds.width),
      y: clamp((event.clientY - bounds.top) * 100 / bounds.height),
    };
  }

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">FLIGHT SCHOOL</p><h1>Light the beacons</h1></div>
        <p className="beacon-count">{cleared} / {beacons.length}</p>
      </div>
      <p>{mouseMode ? 'Aim at a pink ring and click to light it.' : 'Steer into the pink ring, then press the action button.'}</p>
      <div className="training-field" onPointerMove={(event) => {
        if (mouseMode) setPosition(pointerPosition(event));
      }} onPointerDown={(event) => {
        const point = pointerPosition(event);
        setPosition(point);
        if (mouseMode) ping(point);
      }}>
        {beacon && <div key={cleared} className="beacon-ring" data-aligned={isAligned(position)}
          style={{ left: beacon.x + '%', top: beacon.y + '%' }} aria-hidden="true" />}
        <div className="training-ship" style={{ left: position.x + '%', top: position.y + '%' }} aria-hidden="true">
          <PixelSprite name="ship" size={5} />
        </div>
      </div>
      <div className="training-footer">
        <div><p role="status">{beacon ? feedback || 'Find the first beacon.' : 'All beacons lit. You’re cleared for launch!'}</p>
          <p className="input-hint">{mouseMode ? 'Move the pointer to aim · Click or tap to ping' : 'Joystick or arrows to steer · Action button or Space to ping · Tap the field to aim'}</p></div>
        {beacon
          ? <button type="button" className="arcade-btn" onClick={() => ping()}>Ping beacon</button>
          : <button type="button" className="arcade-btn" onClick={nextStep}>Launch mission</button>}
      </div>
    </section>
  );
}
