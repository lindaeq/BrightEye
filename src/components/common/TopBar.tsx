import React from 'react';
import { useArcade, STEP_NAMES } from '../../context/ArcadeContext';
import { Volume2, VolumeX, Menu, Activity } from 'lucide-react';

interface TopBarProps {
  onToggleSteps: () => void;
  stepsOpen: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSteps, stepsOpen }) => {
  const { soundMuted, toggleMute, currentStep } = useArcade();

  return (
    <header className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-[var(--bezel)] text-[var(--scr)] border-b-2 border-black/40 rounded-t-xl select-none">
      
      {/* Left: Steps Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSteps}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-pixel text-xs font-bold transition-all cursor-pointer ${
            stepsOpen
              ? 'bg-[var(--good)] text-black border-transparent'
              : 'bg-black/40 hover:bg-black/60 border-[var(--dim)] text-[var(--scr)]'
          }`}
          title="Toggle Steps Bar"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>STEPS {currentStep}/9</span>
        </button>

        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--good)] animate-pulse" />
          <span className="font-pixel text-sm sm:text-base tracking-wider text-white">
            NEURO ARCADE
          </span>
        </div>
      </div>

      {/* Center: Current Step Title */}
      <div className="hidden lg:flex items-center gap-2 bg-black/40 px-3 py-1 rounded-md border border-[var(--dim)] font-pixel text-xs text-[var(--good)]">
        <span>STEP {currentStep}:</span>
        <span className="text-white">{STEP_NAMES[currentStep - 1]}</span>
      </div>

      {/* Right: QNX RTOS Status + Audio Mute */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono-clean text-emerald-400 bg-black/40 px-2.5 py-1 rounded border border-[var(--dim)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>QNX RTOS Online</span>
        </div>

        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-[var(--dim)] text-[var(--scr)] hover:text-white transition-colors cursor-pointer"
          title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {soundMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-[var(--good)]" />
          )}
        </button>
      </div>

    </header>
  );
};
