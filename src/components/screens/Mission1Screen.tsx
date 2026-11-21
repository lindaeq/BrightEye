import React, { useState, useEffect, useRef } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { playSound } from '../../utils/audio';

interface TargetInstance {
  id: number;
  type: 'Round' | 'Square';
  x: number; // percentage (15 to 85)
  y: number; // percentage (15 to 80)
  spawnTime: number;
}

export const Mission1Screen: React.FC = () => {
  const {
    m1Time,
    m1Score,
    m1Streak,
    m1GapMs,
    m1Logs,
    recordM1Hit,
    nextStep,
  } = useArcade();

  const [timeLeft, setTimeLeft] = useState(20);
  const [currentTarget, setCurrentTarget] = useState<TargetInstance>({
    id: 1,
    type: 'Round',
    x: 62,
    y: 28,
    spawnTime: Date.now(),
  });
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [hitToast, setHitToast] = useState<{ text: string; good: boolean } | null>(null);
  const arenaRef = useRef<HTMLDivElement>(null);

  // Timer countdown
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

  // Target spawning helper
  const spawnNewTarget = () => {
    const isSquare = Math.random() < 0.28; // 28% decoy
    setCurrentTarget({
      id: Date.now(),
      type: isSquare ? 'Square' : 'Round',
      x: Math.floor(Math.random() * 60 + 20),
      y: Math.floor(Math.random() * 55 + 20),
      spawnTime: Date.now(),
    });
  };

  // User zap handler
  const handleTargetClick = (type: 'Round' | 'Square') => {
    const elapsed = Date.now() - currentTarget.spawnTime;
    // Eye gaze snaps sub-150ms, hand clicks after
    const simulatedGap = Math.max(160, Math.min(380, elapsed - 40 + Math.floor(Math.random() * 30)));

    recordM1Hit(type, simulatedGap);

    if (type === 'Round') {
      setHitToast({ text: `ZAP! +${100 * Math.max(1, m1Streak)} (${simulatedGap}ms)`, good: true });
    } else {
      setHitToast({ text: 'DECOY TRICK! -50', good: false });
    }

    setTimeout(() => setHitToast(null), 800);
    spawnNewTarget();
  };

  // Arena mouse / pointer tracking for retro crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCrosshairPos({
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    });
  };

  // Keyboard shortcut: Spacebar fires at crosshair location
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        // Check proximity of crosshair to target
        const dx = Math.abs(crosshairPos.x - currentTarget.x);
        const dy = Math.abs(crosshairPos.y - currentTarget.y);
        if (dx < 25 && dy < 25) {
          handleTargetClick(currentTarget.type);
        } else {
          // Miss
          playSound('laser');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [crosshairPos, currentTarget]);

  return (
    <div className="flex flex-col h-full justify-between gap-3 p-3 sm:p-5 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>Mission 1 · Target lock</span>
        <span>Step 6 of 9</span>
      </div>

      {/* Top Stats HUD (Gap ms, Time, Score, Streak) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Gap ms</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--good)] font-bold">
            {m1GapMs}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Time</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--ink)] font-bold">
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Score</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--good)] font-bold">
            {m1Score}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Streak</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--a1)] font-bold">
            ×{m1Streak}
          </div>
        </div>
      </div>

      {/* Main 2-Column Arena & Live Log */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-3 sm:gap-4 flex-1 items-stretch min-h-[260px]">
        
        {/* Left: Active Game Canvas */}
        <div className="flex flex-col gap-2">
          
          {/* Target rule chips */}
          <div className="flex items-center gap-2 font-terminal text-xs">
            <span className="bg-[var(--good)] text-[var(--on)] px-2 py-0.5 rounded-[var(--r)] uppercase">
              Zap round
            </span>
            <span className="bg-[var(--bad)] text-[var(--on)] px-2 py-0.5 rounded-[var(--r)] uppercase">
              Skip square (Impulse test)
            </span>
          </div>

          {/* Interactive Arena */}
          <div
            ref={arenaRef}
            onMouseMove={handleMouseMove}
            className="relative flex-1 rounded-[var(--r)] border-2 border-[var(--dim)] bg-[var(--fld)] overflow-hidden shadow-inner cursor-crosshair min-h-[220px]"
          >
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(var(--line)_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>

            {/* Hit Feedback Toast */}
            {hitToast && (
              <div className="absolute top-3 inset-x-0 flex justify-center z-30 pointer-events-none">
                <span className={`font-pixel text-[10px] sm:text-xs px-3 py-1 rounded border-2 shadow-lg ${
                  hitToast.good
                    ? 'bg-[var(--good)] text-[var(--on)] border-[var(--on)] animate-bounce'
                    : 'bg-[var(--bad)] text-[var(--on)] border-[var(--on)] animate-pulse'
                }`}>
                  {hitToast.text}
                </span>
              </div>
            )}

            {/* Active Target Instance */}
            <div
              style={{ left: `${currentTarget.x}%`, top: `${currentTarget.y}%` }}
              onClick={() => handleTargetClick(currentTarget.type)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            >
              <div className="relative p-2 flex items-center justify-center">
                {/* Simulated Gaze Lock Ring around target */}
                <div className="absolute -inset-1 gaze-ring opacity-60 pointer-events-none" />

                {currentTarget.type === 'Round' ? (
                  <PixelSprite
                    name="inv"
                    color="var(--good)"
                    size={4}
                    className="group-hover:scale-110 transition-transform drop-shadow"
                  />
                ) : (
                  <PixelSprite
                    name="sq"
                    color="var(--bad)"
                    size={4}
                    className="group-hover:scale-110 transition-transform drop-shadow animate-pulse"
                  />
                )}
              </div>
            </div>

            {/* Crosshair (follows pointer or centered) */}
            <div
              style={{ left: `${crosshairPos.x}%`, top: `${crosshairPos.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15"
            >
              <div className="reticle-cross opacity-75" />
            </div>

            {/* Bottom Arena Helper */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
              <span className="font-terminal text-[11px] text-[var(--dim)] bg-[var(--scr)]/80 px-2 py-0.5 rounded border border-[var(--dim)]">
                CLICK TARGET OR PRESS [SPACEBAR] TO FIRE
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Log Feed */}
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1 mb-2">
              Live QNX Log
            </div>

            <div className="space-y-1 font-terminal text-sm max-h-[190px] overflow-y-auto pr-1">
              {m1Logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b border-[var(--line)] pb-0.5 text-xs sm:text-sm"
                >
                  <span className="text-[var(--ink)]">{log.label}</span>
                  <b className={log.success ? 'text-[var(--good)]' : 'text-[var(--bad)]'}>
                    {log.text}
                  </b>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
            <span className="font-terminal text-[11px] text-[var(--dim)]">
              Saccade clock: 0.42ms jitter
            </span>
            <button
              onClick={nextStep}
              className="arcade-btn font-pixel text-[10px] py-1.5 px-3"
            >
              Next Mission →
            </button>
          </div>
        </div>

      </div>

      {/* Ground strip */}
      <div className="h-1.5 bg-[var(--dim)] rounded-sm w-full opacity-60"></div>

    </div>
  );
};
