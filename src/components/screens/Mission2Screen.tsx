import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { useArcadeControls } from '../../utils/useArcadeControls';
import { useMissionTrace } from '../../utils/useMissionTrace';
import { useEyeTracking } from '../../utils/useEyeTracking';
import type { InputSource } from '../../utils/runTelemetry';
import { playSound } from '../../utils/audio';
import { PixelSprite } from '../common/PixelSprite';

const duration = 25;
const corners = [{ x: 82, y: 20 }, { x: 18, y: 80 }, { x: 18, y: 20 }, { x: 82, y: 80 }];
const clamp = (value: number) => Math.max(5, Math.min(95, value));

export function Mission2Screen() {
  const { mouseMode } = useArcadeController();
  const { nextStep, completeComet } = useArcade();
  const eye = useEyeTracking();

  const field = useRef<HTMLDivElement>(null);
  const ship = useRef({ x: 50, y: 50 });
  const captures = useRef(0);
  const [position, setPosition] = useState(ship.current);
  const [collected, setCollected] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [cornersPair] = useState(() => Math.random() < 0.5 ? 0 : 2);
  const star = corners[cornersPair + collected % 2];

  const eyeRef = useRef(eye);
  eyeRef.current = eye;

  const { markInput, event: recordEvent, finish } = useMissionTrace(() => {
    const target = corners[cornersPair + captures.current % 2];
    const eyeData = eyeRef.current;

    let eyePoint: { x: number; y: number } | null = null;
    let isFocused = false;
    let isExcessive = false;

    if (typeof eyeData.gazeX === 'number' && typeof eyeData.gazeY === 'number') {
      eyePoint = { x: eyeData.gazeX, y: eyeData.gazeY };
      const targetNormX = target.x / 100;
      const targetNormY = target.y / 100;
      const dist = Math.hypot(eyeData.gazeX - targetNormX, eyeData.gazeY - targetNormY);

      if (dist <= 0.28) {
        isFocused = true;
      } else if (eyeData.saccadeDetected && dist > 0.38) {
        // Saccade darting away from tracking path
        isExcessive = true;
      }
    }

    return {
      player: { x: ship.current.x / 100, y: ship.current.y / 100 },
      target: { x: target.x / 100, y: target.y / 100, kind: 'star' },
      eye: eyePoint,
      saccade: eyeData.saccadeDetected,
      focused: isFocused,
      excessive: isExcessive,
    };
  });

  function move(x: number, y: number, source: InputSource) {
    markInput(source);
    const next = { x: clamp(x), y: clamp(y) };
    ship.current = next;
    setPosition(next);

    const bounds = field.current?.getBoundingClientRect();
    if (!bounds) return;
    const target = corners[cornersPair + captures.current % 2];
    const distance = Math.hypot((next.x - target.x) * bounds.width / 100, (next.y - target.y) * bounds.height / 100);
    if (distance <= 35) {
      recordEvent({ kind: 'star-caught', source });
      captures.current++;
      setCollected(captures.current);
      playSound('hit');
    }
  }

  useArcadeControls((x, y, seconds, source) => {
    const fieldSize = field.current?.getBoundingClientRect();
    if (!fieldSize?.width || !fieldSize.height) return;
    const speed = Math.max(240, fieldSize.width * 0.45);
    move(ship.current.x + x * seconds * speed * 100 / fieldSize.width,
      ship.current.y + y * seconds * speed * 100 / fieldSize.height, source);
  });

  useEffect(() => {
    const end = performance.now() + duration * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - performance.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        completeComet(finish(), captures.current);
        playSound('win');
        nextStep();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [nextStep, completeComet, finish]);

  function steerWithPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    move((event.clientX - bounds.left) * 100 / bounds.width,
      (event.clientY - bounds.top) * 100 / bounds.height, 'pointer');
  }

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">MISSION 2</p><h1>Comet tunnel</h1></div>
        <p className="beacon-count">
          {eye.connected && <span style={{ color: '#00E5FF', marginRight: 12 }}>👁 QNX PURSUIT</span>}
          {timeLeft}s · {collected} stars
        </p>
      </div>
      <p>Keep your eyes locked on the star while guiding your ship to it.</p>
      <div ref={field} className="training-field comet-field" style={{ position: 'relative' }} onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        steerWithPointer(event);
      }} onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) steerWithPointer(event);
      }}>
        {/* Live Eye Tracking Gaze Reticle */}
        {eye.connected && !eye.isBlinking && (
          <div 
            style={{
              position: 'absolute',
              left: `${eye.gazeX * 100}%`,
              top: `${eye.gazeY * 100}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          >
            <div style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: `2px solid ${eye.saccadeDetected ? '#FF3366' : '#00E5FF'}`,
              boxShadow: `0 0 12px ${eye.saccadeDetected ? '#FF3366' : '#00E5FF'}`,
              display: 'grid',
              placeItems: 'center',
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: eye.saccadeDetected ? '#FF3366' : '#00E5FF',
              }} />
            </div>
          </div>
        )}

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
