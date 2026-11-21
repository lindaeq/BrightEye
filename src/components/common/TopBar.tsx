import React from 'react';
import { useArcade, STEP_NAMES } from '../../context/ArcadeContext';
import { Volume2, VolumeX, Cpu, Activity, Award } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { soundMuted, toggleMute, currentStep } = useArcade();

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[var(--bezel)] text-[var(--scr)] border-b-2 border-black/30 rounded-t-lg select-none">
      
      {/* Title & Step */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 font-pixel text-xs text-[var(--good)]">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="font-bold tracking-wider">HACKWESTERN</span>
        </div>
        <span className="text-[10px] font-pixel text-[var(--line)] hidden md:inline">·</span>
        <span className="text-xs font-terminal text-[var(--scr)] uppercase tracking-widest hidden sm:inline">
          NEURO-MOTOR ARCADE KIOSK
        </span>
      </div>

      {/* Hardware Link Indicators */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] font-terminal text-[var(--scr)]">
        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-[var(--dim)]">
          <Cpu className="w-3.5 h-3.5 text-[var(--good)]" />
          <span>QNX RTOS Pi 5: <b className="text-[var(--good)]">60 FPS (&lt;1ms Jitter)</b></span>
        </div>
        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-[var(--dim)]">
          <span>Arduino Uno Q: <b className="text-[var(--good)]">Ready</b></span>
        </div>
        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-[var(--dim)]">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Sun Life Health Hack</span>
        </div>
      </div>

      {/* Controls: Audio Mute & Step counter */}
      <div className="flex items-center gap-3">
        <span className="font-pixel text-[10px] text-[var(--good)] bg-black/40 px-2 py-1 rounded">
          {STEP_NAMES[currentStep - 1]}
        </span>

        <button
          onClick={toggleMute}
          className="p-1.5 rounded bg-black/30 hover:bg-black/50 text-[var(--scr)] hover:text-white transition-colors border border-[var(--dim)]"
          title={soundMuted ? 'Unmute 8-Bit Audio' : 'Mute Audio'}
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
