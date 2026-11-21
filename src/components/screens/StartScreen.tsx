import React, { useEffect, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { PixelSprite } from '../common/PixelSprite';
import { playSound } from '../../utils/audio';
import { Play, Shield, Award, CheckCircle } from 'lucide-react';

export const StartScreen: React.FC = () => {
  const { nextStep, goToStep } = useArcade();
  const [selectedMode, setSelectedMode] = useState<'single' | 'operator'>('single');

  // Space / Enter shortcut
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
    <div className="flex flex-col h-full justify-between gap-4 p-6 sm:p-8 overflow-y-auto">
      
      {/* Main 2-Column Layout */}
      <div className="grid md:grid-cols-[1.6fr_1fr] gap-8 flex-1 items-center max-w-5xl mx-auto w-full my-auto">
        
        {/* Left: Arcade Start CTA */}
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <span className="font-pixel text-[10px] uppercase tracking-wider text-[var(--good)] font-bold">
              Pediatric Eye-Hand Coordination Lab
            </span>
            <h1 className="font-pixel text-2xl sm:text-4xl text-[var(--ink)] font-black tracking-tight leading-snug">
              READY, PILOT?
            </h1>
            <p className="font-terminal text-2xl text-[var(--dim)] leading-snug max-w-lg pt-1">
              Two missions to see how smoothly your eyes and hands work together.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex flex-col gap-2 font-terminal text-2xl">
            <button
              onClick={() => setSelectedMode('single')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg border-2 text-left cursor-pointer transition-all ${
                selectedMode === 'single'
                  ? 'border-[var(--good)] bg-[var(--fld)] text-[var(--ink)] font-bold'
                  : 'border-transparent text-[var(--dim)] hover:text-[var(--ink)]'
              }`}
            >
              <span className="text-[var(--good)] font-bold font-pixel text-xs">▶</span>
              <span>Singleplayer Screening Run (1 Min)</span>
            </button>

            <button
              onClick={() => setSelectedMode('operator')}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg border-2 text-left cursor-pointer transition-all ${
                selectedMode === 'operator'
                  ? 'border-[var(--good)] bg-[var(--fld)] text-[var(--ink)] font-bold'
                  : 'border-transparent text-[var(--dim)] hover:text-[var(--ink)]'
              }`}
            >
              <span className="text-[var(--good)] font-bold font-pixel text-xs">▶</span>
              <span>Operator &amp; Clinical Dashboard</span>
            </button>
          </div>

          {/* Giant Glowing Start Button */}
          <div className="pt-2">
            <button
              onClick={handleStart}
              className="arcade-btn glow-guide text-sm px-8 py-4 flex items-center gap-3 shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PRESS START [SPACEBAR]</span>
            </button>
          </div>

          {/* Pixel Sprites */}
          <div className="flex items-center gap-6 pt-2">
            <PixelSprite name="inv" color="var(--good)" size={3.5} />
            <PixelSprite name="sq" color="var(--bad)" size={3.5} />
            <PixelSprite name="ship" color="var(--ink)" size={3.5} />
          </div>
        </div>

        {/* Right: Badges & Hardware Status */}
        <div className="flex flex-col gap-4">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-pixel text-xs text-[var(--ink)] font-bold border-b border-[var(--line)] pb-2">
              <Award className="w-4 h-4 text-[var(--good)]" />
              <span>PILOT BADGES</span>
            </div>
            <div className="space-y-2 font-terminal text-2xl">
              <div className="flex items-center justify-between">
                <span>First Flight</span>
                <b className="text-[var(--good)] flex items-center gap-1 font-bold">
                  Ready <CheckCircle className="w-4 h-4" />
                </b>
              </div>
              <div className="flex items-center justify-between">
                <span>Sharp Eyes</span>
                <span className="text-[var(--dim)]">Mission 1</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Steady Hands</span>
                <span className="text-[var(--dim)]">Mission 2</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-pixel text-xs text-[var(--ink)] font-bold border-b border-[var(--line)] pb-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>SYSTEM STATUS</span>
            </div>
            <div className="space-y-1.5 font-terminal text-xl">
              <div className="flex items-center justify-between">
                <span>QNX Camera</span>
                <b className="text-[var(--good)]">Ready (60 FPS)</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Uno Q Joystick</span>
                <b className="text-[var(--good)]">USB 115200 Baud</b>
              </div>
              <div className="flex items-center justify-between">
                <span>RTOS Timing</span>
                <b className="text-[var(--good)]">&lt; 0.42 ms Jitter</b>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
