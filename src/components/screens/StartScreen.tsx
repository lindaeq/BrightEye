import React, { useEffect, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { playSound } from '../../utils/audio';

export const StartScreen: React.FC = () => {
  const { nextStep, goToStep } = useArcade();
  const [selectedMode, setSelectedMode] = useState<'single' | 'operator'>('single');

  // Space / Enter keyboard shortcut to launch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        playSound('coin');
        if (selectedMode === 'single') {
          nextStep();
        } else {
          goToStep('operator');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, goToStep, selectedMode]);

  const handleStart = () => {
    playSound('coin');
    if (selectedMode === 'single') {
      nextStep();
    } else {
      goToStep('operator');
    }
  };

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-4 sm:p-6 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>HackWestern · Eye-Hand Lab</span>
        <span>Credit 01</span>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-4 sm:gap-6 flex-1 items-center">
        
        {/* Left Column: Title & Start CTA */}
        <div className="flex flex-col justify-center gap-3 sm:gap-4">
          <div className="space-y-1">
            <span className="font-terminal text-xs sm:text-sm uppercase tracking-widest text-[var(--dim)]">
              Pediatric Neuro-Motor Rapid Protocol
            </span>
            <h1 className="font-pixel text-xl sm:text-3xl text-[var(--a1)] leading-tight">
              READY, PILOT?
            </h1>
          </div>

          <p className="font-terminal text-base sm:text-lg text-[var(--dim)] leading-snug max-w-lg">
            Two missions. One minute. See how well your eyes and hands work together.
          </p>

          {/* Mode Selector */}
          <div className="font-terminal text-base sm:text-lg space-y-1 my-1">
            <button
              onClick={() => setSelectedMode('single')}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                selectedMode === 'single'
                  ? 'text-[var(--good)] font-bold'
                  : 'text-[var(--dim)] hover:text-[var(--ink)]'
              }`}
            >
              <span>{selectedMode === 'single' ? '▶' : ' '}</span>
              <span>SINGLEPLAYER · 1 MINUTE</span>
            </button>

            <button
              onClick={() => setSelectedMode('operator')}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                selectedMode === 'operator'
                  ? 'text-[var(--good)] font-bold'
                  : 'text-[var(--dim)] hover:text-[var(--ink)]'
              }`}
            >
              <span>{selectedMode === 'operator' ? '▶' : ' '}</span>
              <span>OPERATOR / CLINICAL MODE</span>
            </button>
          </div>

          {/* Big Arcade Start Button */}
          <div>
            <button
              onClick={handleStart}
              className="arcade-btn blink font-pixel text-xs sm:text-sm px-6 py-3"
            >
              PRESS START [SPACE]
            </button>
          </div>

          {/* Animated Sprite Banner */}
          <div className="flex items-center gap-6 pt-2">
            <div className="animate-bounce">
              <PixelSprite name="inv" color="var(--good)" size={3} />
            </div>
            <div className="animate-pulse">
              <PixelSprite name="sq" color="var(--bad)" size={3} />
            </div>
            <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <PixelSprite name="ship" color="var(--ink)" size={3} />
            </div>
          </div>
        </div>

        {/* Right Column: Badges & Live System Status */}
        <div className="flex flex-col gap-3">
          
          {/* Badges Panel */}
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 sm:p-4 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Your pilot badges
            </div>
            <div className="font-terminal text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span>★ First flight</span>
                <b className="text-[var(--good)]">✓</b>
              </div>
              <div className="flex items-center justify-between">
                <span>★ Sharp eyes</span>
                <b className="text-[var(--good)]">✓</b>
              </div>
              <div className="flex items-center justify-between">
                <span>★ Steady hands</span>
                <span className="text-[var(--dim)] text-xs">Try Mission 2</span>
              </div>
            </div>
          </div>

          {/* System Check Panel */}
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 sm:p-4 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              System Telemetry
            </div>
            <div className="font-terminal text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Camera (QNX)</span>
                <b className="text-[var(--good)]">60 fps Ready</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Joystick (Uno Q)</span>
                <b className="text-[var(--good)]">Ready</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Data link</span>
                <b className="text-[var(--good)]">Online (&lt;1ms)</b>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Ground Strip */}
      <div className="h-2 bg-[var(--dim)] rounded-sm w-full opacity-60"></div>

    </div>
  );
};
