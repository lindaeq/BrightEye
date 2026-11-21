import React, { useState, useEffect, useRef } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { playSound } from '../../utils/audio';
import { ArrowRight } from 'lucide-react';

interface TargetState {
  x: number;
  y: number;
  isSquare: boolean;
  spawnTime: number;
  radius: number;
}

export const Mission1Screen: React.FC = () => {
  const {
    m1Score,
    m1Streak,
    m1GapMs,
    m1Logs,
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

  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [hitToast, setHitToast] = useState<{ text: string; good: boolean } | null>(null);

  // 20-second countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      playSound('win');
      nextStep();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, nextStep]);

  // Spawn new target helper
  const spawnTarget = (width: number, height: number) => {
    const isSquare = Math.random() < 0.28;
    targetRef.current = {
      x: 70 + Math.random() * (width - 140),
      y: 70 + Math.random() * (height - 140),
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
    window.addEventListener('resize', updateCanvasSize);

    const loop = () => {
      ctx.fillStyle = '#070b16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pale radar grid lines
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
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
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 18;
        ctx.fillRect(target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DECOY', target.x, target.y + 4);
      } else {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ZAP', target.x, target.y + 4);
      }
      ctx.shadowBlur = 0;

      // Draw Crosshair
      const ch = crosshairRef.current;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(ch.x, ch.y, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ch.x - 26, ch.y);
      ctx.lineTo(ch.x + 26, ch.y);
      ctx.moveTo(ch.x, ch.y - 26);
      ctx.lineTo(ch.x + 26, ch.y);
      ctx.stroke();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  const handleShoot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dist = Math.hypot(
      crosshairRef.current.x - targetRef.current.x,
      crosshairRef.current.y - targetRef.current.y
    );

    if (dist < 48) {
      const reactionTime = Math.round(performance.now() - targetRef.current.spawnTime);
      if (targetRef.current.isSquare) {
        recordM1Hit('Square', reactionTime);
        setHitToast({ text: 'DECOY TRICK! -50 (Impulse Error)', good: false });
      } else {
        recordM1Hit('Round', reactionTime);
        setHitToast({ text: `HIT! ${reactionTime} ms`, good: true });
      }
      setTimeout(() => setHitToast(null), 900);
      spawnTarget(canvas.width, canvas.height);
    } else {
      playSound('laser');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    crosshairRef.current.x = e.clientX - rect.left;
    crosshairRef.current.y = e.clientY - rect.top;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleShoot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full w-full justify-between gap-1 p-2 sm:p-3 overflow-hidden select-none">
      
      {/* Top Arcade HUD Stats */}
      <div className="grid grid-cols-4 gap-2 px-1">
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Reaction Gap</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--good)] font-bold mt-1">
            {m1GapMs} ms
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Time Remaining</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--ink)] font-bold mt-1">
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Score</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--good)] font-bold mt-1">
            {m1Score}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Streak</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--btn)] font-bold mt-1">
            ×{m1Streak}
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="grid grid-cols-[1fr_210px] sm:grid-cols-[1fr_240px] gap-2 flex-1 items-stretch my-1 min-h-0">
        
        {/* HUGE Canvas Arena */}
        <div className="flex flex-col gap-1 min-h-0">
          
          <div className="flex items-center gap-2 font-pixel text-[10px]">
            <span className="bg-[#10b981] text-black px-2.5 py-1 rounded uppercase font-bold">
              Zap Green Round
            </span>
            <span className="bg-[#f43f5e] text-white px-2.5 py-1 rounded uppercase font-bold">
              Skip Red Square
            </span>
            <span className="ml-auto font-terminal text-sm text-[var(--dim)]">
              Aim with Mouse / Tap, Press [SPACEBAR] to Fire
            </span>
          </div>

          <div className="relative flex-1 rounded-xl border-3 border-[var(--dim)] overflow-hidden shadow-inner min-h-0">
            {hitToast && (
              <div className="absolute top-4 inset-x-0 flex justify-center z-30 pointer-events-none">
                <span className={`font-pixel text-xs px-4 py-2 rounded-lg border-2 shadow-2xl ${
                  hitToast.good
                    ? 'bg-[#10b981] text-black border-white animate-bounce'
                    : 'bg-[#f43f5e] text-white border-white animate-pulse'
                }`}>
                  {hitToast.text}
                </span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onClick={handleShoot}
              className="w-full h-full block cursor-crosshair"
            />
          </div>
        </div>

        {/* Compact Right Live Log */}
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
          <div className="min-h-0 flex-1 flex flex-col">
            <div className="font-pixel text-[10px] uppercase text-[var(--ink)] font-bold border-b border-[var(--line)] pb-1.5 mb-2">
              QNX Live Log
            </div>

            <div className="space-y-1 font-terminal text-base overflow-y-auto pr-1 flex-1">
              {m1Logs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b border-[var(--line)] pb-0.5"
                >
                  <span className="text-[var(--ink)] truncate">{log.label}</span>
                  <b className={`font-bold ${log.success ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>
                    {log.text}
                  </b>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--line)]">
            <button
              onClick={nextStep}
              className="arcade-btn glow-guide text-[10px] py-2 w-full flex items-center justify-center gap-1.5"
            >
              <span>Next Mission</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Slim Bottom Status */}
      <div className="flex items-center justify-between px-2 text-xs font-terminal text-[var(--dim)]">
        <span>QNX RTOS Clock · Deterministic Sub-200ms Telemetry</span>
        <span>Mission 1 of 2</span>
      </div>

    </div>
  );
};
