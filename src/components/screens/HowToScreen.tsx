import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { Play } from 'lucide-react';

export const HowToScreen: React.FC = () => {
  const { nextStep } = useArcade();

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-6 sm:p-8 overflow-y-auto">
      
      {/* Header */}
      <div>
        <h1 className="font-pixel text-xl sm:text-3xl text-[var(--ink)] font-black tracking-tight">
          HOW TO PLAY
        </h1>
        <p className="font-terminal text-2xl text-[var(--dim)] mt-1">
          Simple rules before you take the controls.
        </p>
      </div>

      {/* 3 Large, Clean Cards */}
      <div className="grid md:grid-cols-3 gap-6 my-auto max-w-5xl mx-auto w-full">
        
        {/* Card 1 */}
        <div className="border-3 border-[var(--dim)] bg-[var(--fld)] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-[var(--good)] transition-colors">
          <div>
            <div className="h-28 flex items-center justify-center bg-[var(--scr)] rounded-xl border border-[var(--line)] mb-4">
              <PixelSprite name="inv" color="var(--good)" size={5.5} className="animate-bounce" />
            </div>
            <h2 className="font-pixel text-xs sm:text-sm font-bold text-[var(--good)] mb-2">
              1. ZAP ROUND ALIENS
            </h2>
            <p className="font-terminal text-2xl text-[var(--ink)] leading-snug">
              When a round alien appears, steer your joystick and press the button (or <b>Space</b>) as fast as you can!
            </p>
          </div>
          <span className="font-mono-clean text-xs text-[var(--dim)] border-t border-[var(--line)] pt-2">
            Measures: Reaction Speed
          </span>
        </div>

        {/* Card 2 */}
        <div className="border-3 border-[var(--dim)] bg-[var(--fld)] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-[var(--bad)] transition-colors">
          <div>
            <div className="h-28 flex items-center justify-center bg-[var(--scr)] rounded-xl border border-[var(--line)] mb-4">
              <PixelSprite name="sq" color="var(--bad)" size={5.5} className="animate-pulse" />
            </div>
            <h2 className="font-pixel text-xs sm:text-sm font-bold text-[var(--bad)] mb-2">
              2. SKIP SQUARE TRICKS
            </h2>
            <p className="font-terminal text-2xl text-[var(--ink)] leading-snug">
              Square aliens are decoys! <b>Do not press anything</b>—let them disappear without firing.
            </p>
          </div>
          <span className="font-mono-clean text-xs text-[var(--dim)] border-t border-[var(--line)] pt-2">
            Measures: Impulse Control
          </span>
        </div>

        {/* Card 3 */}
        <div className="border-3 border-[var(--dim)] bg-[var(--fld)] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-[var(--good)] transition-colors">
          <div>
            <div className="h-28 flex items-center justify-center gap-4 bg-[var(--scr)] rounded-xl border border-[var(--line)] mb-4">
              <div className="w-6 h-6 rounded-full bg-[var(--good)] shadow-lg animate-pulse" />
              <div className="w-12 h-1.5 bg-[var(--dim)] rounded-full" />
              <PixelSprite name="ship" color="var(--ink)" size={4} />
            </div>
            <h2 className="font-pixel text-xs sm:text-sm font-bold text-[var(--ink)] mb-2">
              3. STEER IN THE TUNNEL
            </h2>
            <p className="font-terminal text-2xl text-[var(--ink)] leading-snug">
              Follow the comet with your eyes while holding your ship steady in the middle of the corridor.
            </p>
          </div>
          <span className="font-mono-clean text-xs text-[var(--dim)] border-t border-[var(--line)] pt-2">
            Measures: Smooth Pursuit &amp; Hand Steadiness
          </span>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-3 border-t border-[var(--line)]">
        <button
          onClick={nextStep}
          className="arcade-btn glow-guide text-xs sm:text-sm px-8 py-4 flex items-center gap-3"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START FIRST GAME</span>
        </button>
      </div>

    </div>
  );
};
