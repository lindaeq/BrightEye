import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { playSound } from '../../utils/audio';
import { PixelSprite } from '../common/PixelSprite';

const duration = 25;
const corners = [{ x: 82, y: 20 }, { x: 18, y: 80 }, { x: 18, y: 20 }, { x: 82, y: 80 }];
const clamp = (value: number) => Math.max(5, Math.min(95, value));

export function Mission2Screen() {
  const { mouseMode } = useArcadeController();
  const { nextStep, setStarsCaught } = useArcade();
  const field = useRef<HTMLDivElement>(null);
  const ship = useRef({ x: 50, y: 50 });
  const captures = useRef(0);
  const [position, setPosition] = useState(ship.current);
  const [collected, setCollected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [cornersPair] = useState(() => Math.random() < 0.5 ? 0 : 2);
  const star = corners[cornersPair + collected % 2];

  function move(x: number, y: number) {
    const next = { x: clamp(x), y: clamp(y) };
    ship.current = next;
    setPosition(next);

    const bounds = field.current?.getBoundingClientRect();
    if (!bounds) return;
    const target = corners[cornersPair + captures.current % 2];
    const distance = Math.hypot((next.x - target.x) * bounds.width / 100, (next.y - target.y) * bounds.height / 100);
    if (distance <= 35) {
      captures.current++;
      setCollected(captures.current);
      playSound('hit');
    }
  }

  useArcadeControls((x, y, seconds) => {
    const fieldSize = field.current?.getBoundingClientRect();
    if (!fieldSize?.width || !fieldSize.height) return;
    const speed = Math.max(240, fieldSize.width * 0.45);
    move(ship.current.x + x * seconds * speed * 100 / fieldSize.width,
      ship.current.y + y * seconds * speed * 100 / fieldSize.height);
  });

  useEffect(() => {
    const end = performance.now() + duration * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        setStarsCaught(captures.current);
        playSound('win');
        nextStep();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [nextStep, setStarsCaught]);

  function steerWithPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    move((event.clientX - bounds.left) * 100 / bounds.width,
      (event.clientY - bounds.top) * 100 / bounds.height);
  }

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">MISSION 2</p><h1>Comet tunnel</h1></div>
        <p className="beacon-count">{timeLeft}s · {collected} stars</p>
      </div>
      <p>Fly into the star, then chase it to the opposite corner.</p>
      <div ref={field} className="training-field comet-field" onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        steerWithPointer(event);
      }} onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) steerWithPointer(event);
      }}>
        <div key={collected} className="comet-star" style={{ left: star.x + '%', top: star.y + '%' }} aria-hidden="true">✦</div>
        <div className="training-ship" style={{ left: position.x + '%', top: position.y + '%' }} aria-hidden="true">
          <PixelSprite name="ship" size={6} />
        </div>
      </div>
      <div className="training-footer">
        <p className="input-hint">{mouseMode ? 'Click and drag to fly · Tap a spot to move there' : 'Joystick or arrow keys to fly in all four directions · Tap or drag to steer'}</p>
        <span className="sr-only" role="status">{collected} stars caught</span>
      </div>
    </section>
  );
}
