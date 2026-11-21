import React, { useState, useEffect } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { playSound } from '../../utils/audio';
import { ArrowRight } from 'lucide-react';

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

  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [cometX, setCometX] = useState<number>(20);
  const [shipY, setShipY] = useState<number>(50); // percentage 22 to 78
  const [cometDirection, setCometDirection] = useState<number>(1);

  // Timer, Comet motion & Tremor loop
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
        let next = prev + 5 * cometDirection;
        if (next > 82) {
          setCometDirection(-1);
          next = 82;
        } else if (next < 18) {
          setCometDirection(1);
          next = 18;
        }
        return next;
      });

      const inCorridor = shipY >= 26 && shipY <= 74;
      const noise = inCorridor ? Math.random() * 5 + 8 : Math.random() * 14 + 10;
      const eyeSmooth = Math.random() > 0.15;
      updateM2Tremor(noise, inCorridor, eyeSmooth);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, cometDirection, shipY, updateM2Tremor, nextStep]);

  // Steer ship with keys
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

  const sparklinePoints = m2TremorPoints
    .map((val, idx) => {
      const x = (idx / (m2TremorPoints.length - 1)) * 100;
      const y = Math.max(2, Math.min(22, 24 - val));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col h-full w-full justify-between gap-1 p-2 sm:p-3 overflow-hidden select-none">
      
      {/* Top Stats HUD (Time, Steady, On path, Eyes on comet) */}
      <div className="grid grid-cols-4 gap-2 px-1">
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Time Remaining</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--ink)] font-bold mt-1">
            0:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Motor Steadiness</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--good)] font-bold mt-1">
            {Math.round(m2Steady)}%
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Path Accuracy</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--ink)] font-bold mt-1">
            {Math.round(m2OnPath)}%
          </div>
        </div>

        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-lg p-2 text-center shadow-sm">
          <span className="font-pixel text-[9px] text-[var(--dim)] uppercase block">Eyes on Comet</span>
          <div className="font-pixel text-sm sm:text-base text-[var(--good)] font-bold mt-1">
            {Math.round(m2EyesOnComet)}%
          </div>
        </div>
      </div>

      {/* Main Game Area: MASSIVE Tunnel + COMPACT Tremor Gauge */}
      <div className="grid grid-cols-[1fr_210px] sm:grid-cols-[1fr_240px] gap-2 flex-1 items-stretch my-1 min-h-0">
        
        {/* HUGE Main Asteroid Tunnel */}
        <div className="flex flex-col gap-1 min-h-0">
          
          <div className="flex items-center gap-2 font-pixel text-[10px]">
            <span className="bg-[#10b981] text-black px-2.5 py-1 rounded uppercase font-bold">
              Eyes on comet
            </span>
            <span className="bg-[var(--btn)] text-white px-2.5 py-1 rounded uppercase font-bold">
              Steer ship with [W/S] or [↑/↓]
            </span>
          </div>

          {/* Interactive Tunnel Field */}
          <div className="relative flex-1 rounded-xl border-3 border-[var(--dim)] bg-[var(--fld)] overflow-hidden shadow-inner min-h-0">
            
            {/* Pale Upper Wall */}
            <div className="tunnel-wall absolute top-0 inset-x-0 h-[20%] border-b-2 border-[var(--dim)] opacity-40" />

            {/* Pale Lower Wall */}
            <div className="tunnel-wall absolute bottom-0 inset-x-0 h-[20%] border-t-2 border-[var(--dim)] opacity-40" />

            {/* Center Dashed Line */}
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-[var(--line)] opacity-40 pointer-events-none" />

            {/* Smooth Pursuit Comet with Tail */}
            <div
              style={{ left: `${cometX}%`, top: '35%' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none z-20"
            >
              <div className="relative flex items-center">
                <div className="w-24 sm:w-36 h-3 bg-gradient-to-l from-[var(--good)] to-transparent opacity-85 rounded-full" />
                
                <div className="relative w-9 h-9 rounded-full bg-[var(--good)] shadow-[0_0_25px_var(--good)] flex items-center justify-center animate-pulse">
                  <div className="absolute -inset-2 gaze-ring opacity-80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />
                </div>
              </div>

              <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-white bg-black/70 px-2 py-0.5 rounded whitespace-nowrap shadow">
                GAZE TARGET
              </span>
            </div>

            {/* Player Spaceship */}
            <div
              style={{ left: '18%', top: `${shipY}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150 z-20"
            >
              <div className="relative drop-shadow-xl">
                <PixelSprite name="ship" color="var(--ink)" size={4.5} />
              </div>
            </div>

            {/* Steer Buttons */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-25">
              <button
                onClick={() => setShipY(prev => Math.max(22, prev - 8))}
                className="arcade-btn alt font-pixel text-xs p-3 rounded-lg cursor-pointer"
                title="Steer Up"
              >
                ▲
              </button>
              <button
                onClick={() => setShipY(prev => Math.min(78, prev + 8))}
                className="arcade-btn alt font-pixel text-xs p-3 rounded-lg cursor-pointer"
                title="Steer Down"
              >
                ▼
              </button>
            </div>

          </div>

        </div>

        {/* Compact Right Tremor Telemetry */}
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-2.5 flex flex-col justify-between overflow-hidden shadow-sm">
          <div className="space-y-2">
            <div>
              <div className="font-pixel text-[9px] uppercase text-[var(--ink)] font-bold border-b border-[var(--line)] pb-1 mb-2">
                Hand Tremor (DCD)
              </div>

              <div className="bg-[var(--scr)] p-2 rounded-lg border border-[var(--line)] shadow-inner">
                <svg className="w-full h-10 text-[var(--good)]" viewBox="0 0 100 24" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    points={sparklinePoints}
                  />
                </svg>
              </div>

              <div className="font-terminal text-sm text-[var(--good)] font-bold mt-1.5 flex items-center gap-1.5">
                <span>✓ Low Jitter Steady (σ: 0.06)</span>
              </div>
            </div>

            <div className="border-t border-[var(--line)] pt-2 space-y-1">
              <div className="font-pixel text-[9px] uppercase text-[var(--ink)] font-bold">
                Eye Pursuit
              </div>
              <p className="font-terminal text-base font-medium text-[var(--ink)]">
                Smooth Track · {m2CatchUpJumps} catch-up saccades
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--line)]">
            <button
              onClick={nextStep}
              className="arcade-btn glow-guide text-[10px] py-2 w-full flex items-center justify-center gap-1.5"
            >
              <span>View Pilot Card</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Slim Bottom Status */}
      <div className="flex items-center justify-between px-2 text-xs font-terminal text-[var(--dim)]">
        <span>Dual-Sensory Telemetry Engine Active</span>
        <span>Mission 2 of 2</span>
      </div>

    </div>
  );
};
