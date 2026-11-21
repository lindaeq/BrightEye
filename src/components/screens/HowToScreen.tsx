import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';

export const HowToScreen: React.FC = () => {
  const { nextStep } = useArcade();

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-4 sm:p-6 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>How to play</span>
        <span>Step 5 of 9</span>
      </div>

      <div className="space-y-1">
        <h1 className="font-pixel text-base sm:text-xl text-[var(--a1)]">
          TWO MISSIONS · 30 SECONDS EACH
        </h1>
        <p className="font-terminal text-sm text-[var(--dim)]">
          Read the mission briefing before taking control of the arcade console.
        </p>
      </div>

      {/* 3 Instruction Cards */}
      <div className="grid md:grid-cols-3 gap-4 my-auto">
        
        {/* Card 1: Mission 1 Look & Zap */}
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-[var(--a1)] transition-colors">
          <div>
            <span className="font-terminal text-xs uppercase tracking-widest text-[var(--good)] font-bold block mb-2">
              Mission 1 · Look &amp; Zap
            </span>
            <div className="h-20 flex items-center justify-center bg-[var(--scr)] rounded border border-[var(--line)] mb-3">
              <PixelSprite name="inv" color="var(--good)" size={4} className="animate-bounce" />
            </div>
            <p className="font-terminal text-base text-[var(--ink)] leading-snug">
              Look at the <b>round alien</b>, steer the crosshair onto it, and press the fire button!
            </p>
          </div>
          <span className="font-terminal text-xs text-[var(--dim)] border-t border-[var(--line)] pt-1.5">
            Tests: Eye-to-Hand Reaction Latency
          </span>
        </div>

        {/* Card 2: Mission 1 Skip Tricks */}
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-[var(--bad)] transition-colors">
          <div>
            <span className="font-terminal text-xs uppercase tracking-widest text-[var(--bad)] font-bold block mb-2">
              Mission 1 · Skip Decoys
            </span>
            <div className="h-20 flex items-center justify-center bg-[var(--scr)] rounded border border-[var(--line)] mb-3">
              <PixelSprite name="sq" color="var(--bad)" size={4} className="animate-pulse" />
            </div>
            <p className="font-terminal text-base text-[var(--ink)] leading-snug">
              <b>Square aliens are tricks!</b> Resist the impulse to click—let them vanish.
            </p>
          </div>
          <span className="font-terminal text-xs text-[var(--dim)] border-t border-[var(--line)] pt-1.5">
            Tests: ADHD Impulse Inhibition Control
          </span>
        </div>

        {/* Card 3: Mission 2 Smooth Pursuit */}
        <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-[var(--a1)] transition-colors">
          <div>
            <span className="font-terminal text-xs uppercase tracking-widest text-[var(--a1)] font-bold block mb-2">
              Mission 2 · Follow &amp; Steer
            </span>
            <div className="h-20 flex items-center justify-center gap-4 bg-[var(--scr)] rounded border border-[var(--line)] mb-3 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-[var(--good)] shadow-[0_0_10px_var(--good)] animate-pulse" />
              <div className="w-8 h-1 bg-[var(--dim)]" />
              <PixelSprite name="ship" color="var(--ink)" size={3} />
            </div>
            <p className="font-terminal text-base text-[var(--ink)] leading-snug">
              Lock your eyes on the moving comet while steering your ship through the corridor.
            </p>
          </div>
          <span className="font-terminal text-xs text-[var(--dim)] border-t border-[var(--line)] pt-1.5">
            Tests: Smooth Pursuit &amp; Hand Tremor (DCD)
          </span>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
        <span className="font-terminal text-xs text-[var(--dim)]">
          Total protocol duration: ~60 seconds
        </span>
        <button
          onClick={nextStep}
          className="arcade-btn font-pixel text-xs px-6 py-3"
        >
          I’M READY → LAUNCH MISSION 1
        </button>
      </div>

    </div>
  );
};
