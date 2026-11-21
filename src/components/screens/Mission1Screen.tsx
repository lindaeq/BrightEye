import React, { useState, useEffect, useRef } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useArcadeController } from '../../context/ArcadeController';
import { playSound } from '../../utils/audio';
import { useArcadeControls } from '../../utils/useArcadeControls';

const roundSeconds = 20;

interface TargetState {
  x: number;
  y: number;
  isSquare: boolean;
  spawnTime: number;
  radius: number;
}

export const Mission1Screen: React.FC = () => {
  const { mouseMode } = useArcadeController();
  const {
    m1Score,
    recordM1Hit,
    nextStep,
  } = useArcade();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crosshairRef = useRef<{ x: number; y: number }>({ x: 400, y: 250 });
  const targetRef = useRef<TargetState>({
    x: 350,
    y: 200,
    isSquare: false,
    spawnTime: performance.now(),
    radius: 30,
  });

  const startedAt = useRef(performance.now());
  const [timeLeft, setTimeLeft] = useState(roundSeconds);
  const toastTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const [hitToast, setHitToast] = useState<string | null>(null);

  useEffect(() => {
    startedAt.current = performance.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil(roundSeconds - (performance.now() - startedAt.current) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        playSound('win');
        nextStep();
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [nextStep]);

  // Spawn new target helper
  const spawnTarget = (width: number, height: number) => {
    const isSquare = Math.random() < 0.28;
    targetRef.current = {
      x: width * (0.15 + Math.random() * 0.7),
      y: height * (0.2 + Math.random() * 0.6),
      isSquare,
      spawnTime: performance.now(),
      radius: 30,
    };
  };

  // Canvas loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (targetRef.current.x > rect.width || targetRef.current.y > rect.height) {
          spawnTarget(rect.width, rect.height);
        }
      }
    };
    updateCanvasSize();
    crosshairRef.current = { x: canvas.width / 2, y: canvas.height / 2 };
    targetRef.current = { x: canvas.width * 0.65, y: canvas.height * 0.4, isSquare: false, radius: 30, spawnTime: performance.now() };
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas);

    const loop = () => {
      const now = performance.now();
      const difficulty = Math.min(1, (now - startedAt.current) / (roundSeconds * 1000));
      const targetLifetime = 2600 - difficulty * 1750;
      if (now - targetRef.current.spawnTime >= targetLifetime) {
        spawnTarget(canvas.width, canvas.height);
      }
      ctx.fillStyle = '#1b143e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pale radar grid lines
      ctx.strokeStyle = 'rgba(151, 112, 199, 0.24)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Target
      const target = targetRef.current;
      if (target.isSquare) {
        ctx.fillStyle = '#D9BDC5';
        ctx.shadowColor = '#D9BDC5';
        ctx.shadowBlur = 18;
        ctx.fillRect(target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2);

        ctx.fillStyle = '#03012C';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DECOY', target.x, target.y + 4);
      } else {
        ctx.fillStyle = '#439A86';
        ctx.shadowColor = '#439A86';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#E9FAE3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#03012C';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ZAP', target.x, target.y + 4);
      }
      ctx.shadowBlur = 0;

      // Draw Crosshair
      const ch = crosshairRef.current;
      ctx.strokeStyle = '#D9BDC5';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ch.x - 26, ch.y);
      ctx.lineTo(ch.x + 26, ch.y);
      ctx.moveTo(ch.x, ch.y - 26);
      ctx.lineTo(ch.x, ch.y + 26);
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  const handleShoot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = targetRef.current;
    const dx = crosshairRef.current.x - target.x;
    const dy = crosshairRef.current.y - target.y;
    const distance = target.isSquare ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.hypot(dx, dy);

    if (distance <= target.radius + 8) {
      const reactionTime = Math.round(performance.now() - targetRef.current.spawnTime);
      if (targetRef.current.isSquare) {
        recordM1Hit('Square', reactionTime);
        setHitToast('That was a decoy!');
      } else {
        recordM1Hit('Round', reactionTime);
        setHitToast('Target hit!');
      }
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setHitToast(null), 900);
      spawnTarget(canvas.width, canvas.height);
    } else {
      playSound('laser');
    }
  };

  const handleMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    crosshairRef.current.x = e.clientX - rect.left;
    crosshairRef.current.y = e.clientY - rect.top;
  };

  useArcadeControls((x, y, seconds) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const aim = crosshairRef.current;
    aim.x = Math.max(0, Math.min(canvas.width, aim.x + x * 420 * seconds));
    aim.y = Math.max(0, Math.min(canvas.height, aim.y + y * 420 * seconds));
  }, handleShoot);

  return (
    <section className="training-screen">
      <div className="training-heading">
        <div><p className="arcade-kicker">MISSION 1</p><h1>Target lock</h1></div>
        <p className="beacon-count">{timeLeft}s &middot; {m1Score} pts</p>
      </div>
      <p>{mouseMode ? 'Click the round targets. Let the squares pass.' : 'Aim at the round targets and press the action button. Let the squares pass.'}</p>
      <div className="training-field target-field">
        <canvas ref={canvasRef} aria-label="Target lock arena" onPointerMove={handleMouseMove}
          onPointerDown={(event) => {
            handleMouseMove(event);
            handleShoot();
          }} />
        {hitToast && <p className="target-feedback" role="status">{hitToast}</p>}
      </div>
      <div className="training-footer">
        <p className="input-hint">{mouseMode ? 'Move the pointer to aim · Click or tap to fire' : 'Joystick or arrows to aim · Action button or Space to fire · Tap a target to zap it'}</p>
        <button type="button" className="arcade-btn" onClick={handleShoot}>Fire</button>
      </div>
    </section>
  );
};
