import React from 'react';
import { useGame } from '../../context/GameContext';
import { ScreenState } from '../../types/telemetry';
import { 
  Activity, 
  Cpu, 
  Gamepad2, 
  Eye, 
  Award, 
  Zap, 
  Settings2,
  Compass
} from 'lucide-react';

interface NavbarProps {
  onToggleDebug: () => void;
  debugOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleDebug, debugOpen }) => {
  const { currentScreen, setScreen, hardware, metrics } = useGame();

  const screens: { id: ScreenState; label: string; icon: React.ReactNode }[] = [
    { id: 'ATTRACT', label: 'Attract Mode', icon: <Zap className="w-4 h-4" /> },
    { id: 'CALIBRATION', label: 'Calibration', icon: <Compass className="w-4 h-4" /> },
    { id: 'STAGE1_TARGET_LOCK', label: 'Stage 1: Target Lock (15s)', icon: <Eye className="w-4 h-4" /> },
    { id: 'STAGE2_ASTEROID_TUNNEL', label: 'Stage 2: Asteroid Tunnel (15s)', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'RESULTS_CARD', label: 'Neuro-Motor Card', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-cyan-900/40 bg-[#090d1e]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & RTOS Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/50 shadow-inner shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                AERO NEURO
              </span>
              <span className="text-[10px] font-tech uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                QNX RTOS KIOSK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-tech">
              Sub-200ms Pediatric Latency & Tremor Screener
            </p>
          </div>
        </div>

        {/* 7-Segment Reaction Gap Live Feedback HUD */}
        <div className="hidden lg:flex items-center gap-2 bg-[#050813] border border-cyan-500/30 px-3 py-1.5 rounded-md shadow-inner">
          <span className="text-[11px] font-tech text-cyan-400/80 tracking-widest uppercase">
            7-SEG REACTION GAP:
          </span>
          <div className="seven-seg text-cyan-300 font-bold text-lg tracking-wider bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20 min-w-[75px] text-center">
            {metrics.stage1.lastReactionGapMs} <span className="text-xs text-cyan-500">ms</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>

        {/* Hardware Status Badges */}
        <div className="flex items-center gap-2 text-xs font-tech">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            hardware.qnxConnected 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>RPi 5 (QNX Vision)</span>
            <span className="text-[10px] opacity-75">±{hardware.qnxRtosLatencyMs}ms</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            hardware.arduinoConnected 
              ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' 
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}>
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Arduino Uno Q (Arcade)</span>
          </div>

          <button
            onClick={onToggleDebug}
            className={`p-1.5 rounded border transition-colors ${
              debugOpen 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle Hardware Telemetry Inspector"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Screen Navigation Tabs (Quick Screen Switcher for Testing/Judges) */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-tech text-slate-400 uppercase mr-1 hidden sm:inline">
            Screens:
          </span>
          {screens.map(screen => (
            <button
              key={screen.id}
              onClick={() => setScreen(screen.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-tech uppercase tracking-wider transition-all ${
                currentScreen === screen.id
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,243,255,0.25)] font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {screen.icon}
              <span>{screen.label}</span>
            </button>
          ))}
        </div>

        {/* Prize Tracks Tagline */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-tech text-slate-400">
          <span className="text-amber-400 font-semibold">Hack Western 13:</span>
          <span className="bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-600/30">
            QNX RTOS
          </span>
          <span className="bg-sky-950/40 text-sky-300 px-2 py-0.5 rounded border border-sky-600/30">
            Sun Life Health Hack
          </span>
          <span className="bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded border border-purple-600/30">
            Best Hardware
          </span>
        </div>
      </div>
    </header>
  );
};
