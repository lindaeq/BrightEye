import React, { useState, useEffect } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { playSound } from '../../utils/audio';

export const Mission2Screen: React.FC = () => {
  const {
    m2Steady,
    m2OnPath,
    m2EyesOnComet,
    m2TremorPoints,
    m2CatchUpJumps,
    updateM2Tremor,
    nextStep,
  } = useArcade();

  const [timeLeft, setTimeLeft] = useState(25);
  const [cometX, setCometX] = useState(20);
  const [shipY, setShipY] = useState(50); // percentage 25 to 75
  const [cometDirection, setCometDirection] = useState(1);

  // Timer & Comet motion loop
  useEffect(() => {
    if (timeLeft <= 0) {
      playSound('win');
      nextStep();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);

      // Smoothly advance comet back and forth
      setCometX(prev => {
        let next = prev + 4 * cometDirection;
        if (next > 80) {
          setCometDirection(-1);
          next = 80;
        } else if (next < 20) {
          setCometDirection(1);
          next = 20;
        }
        return next;
      });

      // Sample micro-tremor variance & corridor accuracy
      const inCorridor = shipY >= 28 && shipY <= 72;
      const noise = inCorridor ? Math.random() * 6 + 8 : Math.random() * 12 + 10;
      const eyeSmooth = Math.random() > 0.15; // occasional catch-up jump
      updateM2Tremor(noise, inCorridor, eyeSmooth);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, cometDirection, shipY, updateM2Tremor, nextStep]);

  // Steer ship with keys (ArrowUp / ArrowDown / W / S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setShipY(prev => Math.max(22, prev - 6));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShipY(prev => Math.min(78, prev + 6));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build SVG sparkline polyline points string from m2TremorPoints
  const sparklinePoints = m2TremorPoints
    .map((val, idx) => {
      const x = (idx / (m2TremorPoints.length - 1)) * 100;
      const y = Math.max(2, Math.min(22, 24 - val));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col h-full justify-between gap-3 p-3 sm:p-5 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>Mission 2 · Comet tunnel</span>
        <span>Step 7 of 9</span>
      </div>

      {/* Top Stats HUD (Time, Steady, On path, Eyes on comet) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Time</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--ink)] font-bold">
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Steady</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--good)] font-bold">
            {Math.round(m2Steady)}%
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">On path</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--ink)] font-bold">
            {Math.round(m2OnPath)}%
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-1.5 sm:p-2 text-center">
          <span className="font-terminal text-[10px] sm:text-xs text-[var(--dim)] uppercase block">Eyes on comet</span>
          <div className="font-pixel text-sm sm:text-lg text-[var(--good)] font-bold">
            {Math.round(m2EyesOnComet)}%
          </div>
        </div>
      </div>

      {/* Main 2-Column Arena & Tremor Sparkline */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-3 sm:gap-4 flex-1 items-stretch min-h-[260px]">
        
        {/* Left: Comet Tunnel Arena */}
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center gap-2 font-terminal text-xs">
            <span className="bg-[var(--good)] text-[var(--on)] px-2 py-0.5 rounded-[var(--r)] uppercase">
              Eyes on comet (Smooth pursuit)
            </span>
            <span className="bg-[var(--dim)] text-[var(--on)] px-2 py-0.5 rounded-[var(--r)] uppercase">
              Steer the ship [↑ / ↓]
            </span>
          </div>

          {/* Interactive Tunnel Field */}
          <div className="relative flex-1 rounded-[var(--r)] border-2 border-[var(--dim)] bg-[var(--fld)] overflow-hidden shadow-inner min-h-[220px]">
            
            {/* Upper Striped Wall */}
            <div className="tunnel-wall absolute top-0 inset-x-0 h-[22%] border-b-2 border-[var(--dim)] opacity-80" />

            {/* Lower Striped Wall */}
            <div className="tunnel-wall absolute bottom-0 inset-x-0 h-[22%] border-t-2 border-[var(--dim)] opacity-80" />

            {/* Center Dashed Navigation Line */}
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-[var(--dim)] opacity-50 pointer-events-none" />

            {/* Smooth Pursuit Comet with Tail */}
            <div
              style={{ left: `${cometX}%`, top: '35%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none z-20"
            >
              <div className="relative flex items-center">
                {/* Comet Tail */}
                <div className="w-16 sm:w-24 h-2 bg-gradient-to-l from-[var(--good)] to-transparent opacity-80 rounded-full" />
                
                {/* Comet Nucleus */}
                <div className="relative w-6 h-6 rounded-full bg-[var(--good)] shadow-[0_0_15px_var(--good)] flex items-center justify-center animate-pulse">
                  {/* Eye gaze lock reticle */}
                  <div className="absolute -inset-1.5 gaze-ring opacity-80" />
                </div>
              </div>
            </div>

            {/* Player Spaceship (Steered with W/S or keys) */}
            <div
              style={{ left: '20%', top: `${shipY}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 z-20"
            >
              <div className="relative">
                <PixelSprite name="ship" color="var(--ink)" size={3.5} />
              </div>
            </div>

            {/* In-game corridor steer controls for touch/mouse */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-25">
              <button
                onClick={() => setShipY(prev => Math.max(22, prev - 8))}
                className="arcade-btn alt font-pixel text-[10px] p-2 rounded"
                title="Steer Up"
              >
                ▲
              </button>
              <button
                onClick={() => setShipY(prev => Math.min(78, prev + 8))}
                className="arcade-btn alt font-pixel text-[10px] p-2 rounded"
                title="Steer Down"
              >
                ▼
              </button>
            </div>

          </div>

        </div>

        {/* Right: Tremor Sparkline & Intrusions Details */}
        <div className="flex flex-col justify-between gap-3">
          
          {/* Hand Shake / Tremor Sparkline */}
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Hand shake (DCD Tremor)
            </div>

            {/* Real-time Dynamic SVG Sparkline */}
            <div className="bg-[var(--scr)] p-2 rounded border border-[var(--line)]">
              <svg className="w-full h-10 text-[var(--good)]" viewBox="0 0 100 24" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={sparklinePoints}
                />
              </svg>
            </div>

            <div className="font-terminal text-sm text-[var(--good)] font-bold">
              ✓ Low jitter (Normal pediatric tremor index)
            </div>
          </div>

          {/* Eye Follow / Saccadic Intrusions */}
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 space-y-1">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Eye follow
            </div>
            <p className="font-terminal text-sm text-[var(--ink)]">
              Smooth · {m2CatchUpJumps} catch-up jumps
            </p>
            <p className="font-terminal text-xs text-[var(--dim)]">
              No pathological nystagmus or dysmetria detected.
            </p>
          </div>

          {/* Action to complete */}
          <button
            onClick={nextStep}
            className="arcade-btn font-pixel text-[10px] py-2.5 w-full"
          >
            Finish Mission →
          </button>

        </div>

      </div>

      {/* Ground strip */}
      <div className="h-1.5 bg-[var(--dim)] rounded-sm w-full opacity-60"></div>

    </div>
  );
};
