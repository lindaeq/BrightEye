import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  Timer, 
  Eye, 
  Navigation, 
  Activity, 
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';

export const Stage2AsteroidTunnel: React.FC = () => {
  const { completeStage2, metrics } = useGame();
  const [timeLeft, setTimeLeft] = useState(15);
  const [cometProgress, setCometProgress] = useState(15); // 0 to 100% across screen
  const [shipY, setShipY] = useState(50); // Ship vertical corridor position
  const [saccadicIntrusions, setSaccadicIntrusions] = useState(2);
  const [jitterIndex, setJitterIndex] = useState(94); // Steadiness percentage

  // 15-second game countdown loop framework
  useEffect(() => {
    if (timeLeft <= 0) {
      completeStage2();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
      // Advance comet across screen
      setCometProgress(prev => (prev >= 85 ? 15 : prev + 6));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, completeStage2]);

  const handleSimulateTremorSpike = () => {
    setJitterIndex(prev => Math.max(70, prev - 8));
    setSaccadicIntrusions(prev => prev + 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      
      {/* Top Arcade HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0a0f26]/90 border border-purple-900/60 p-3 rounded-xl">
        
        {/* Stage Timer */}
        <div className="flex items-center gap-3 border-r border-slate-800 pr-2">
          <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-500/30 text-purple-400">
            <Timer className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">TIME REMAINING</span>
            <div className="font-orbitron font-bold text-2xl text-purple-300">
              {timeLeft}<span className="text-sm font-tech text-purple-500">s</span>
            </div>
          </div>
        </div>

        {/* Smooth Pursuit Status (QNX Eyes) */}
        <div className="flex items-center gap-3 border-r border-slate-800 pr-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">SACCADIC INTRUSIONS</span>
            <div className="font-orbitron font-bold text-2xl text-cyan-300">
              {saccadicIntrusions} <span className="text-xs text-slate-500">jumps</span>
            </div>
          </div>
        </div>

        {/* Motor Steadiness (Joystick Tremor Index) */}
        <div className="flex items-center gap-3 border-r border-slate-800 pr-2">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">MOTOR STEADINESS</span>
            <div className="seven-seg text-2xl font-bold text-emerald-300">
              {jitterIndex}% <span className="text-xs font-tech text-emerald-500">STABLE</span>
            </div>
          </div>
        </div>

        {/* Corridor Path Deviation */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">PATH ACCURACY</span>
            <div className="font-orbitron font-bold text-2xl text-indigo-300">
              {metrics.stage2.corridorAccuracy}%
            </div>
          </div>
        </div>

      </div>

      {/* Main 15-Second Space Arena / Asteroid Tunnel Canvas */}
      <div className="relative aspect-[16/9] max-h-[580px] w-full bg-[#050614] rounded-2xl border-2 border-purple-500/30 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)] flex items-center justify-center">
        
        {/* CRT Scanline & Starfield Effect */}
        <div className="absolute inset-0 scanlines opacity-50"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:28px_28px]"></div>

        {/* Upper and Lower Asteroid Tunnel Bounds */}
        <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-purple-950/60 to-transparent border-b border-purple-500/20 flex items-center px-4">
          <span className="text-[10px] font-tech text-purple-400/80 uppercase tracking-widest">
            ▲ ASTEROID CORRIDOR BOUNDARY UPPER
          </span>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-purple-950/60 to-transparent border-t border-purple-500/20 flex items-end px-4 pb-2">
          <span className="text-[10px] font-tech text-purple-400/80 uppercase tracking-widest">
            ▼ ASTEROID CORRIDOR BOUNDARY LOWER
          </span>
        </div>

        {/* Smooth Pursuit Target Comet (Smooth Traversing Path) */}
        <div 
          style={{ left: `${cometProgress}%`, top: '42%' }}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 pointer-events-none"
        >
          <div className="relative flex items-center">
            {/* Comet Tail */}
            <div className="w-24 h-4 bg-gradient-to-l from-cyan-400 via-sky-500 to-transparent opacity-75 blur-[2px]"></div>
            
            {/* Comet Nucleus (Player must fixate eyes on this) */}
            <div className="w-10 h-10 rounded-full bg-cyan-300 border-2 border-white shadow-[0_0_25px_rgba(0,243,255,1)] flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-indigo-950" />
            </div>
          </div>
          <span className="text-[10px] font-tech text-cyan-300 bg-black/70 px-2 py-0.5 rounded border border-cyan-500/30 mt-2 block whitespace-nowrap">
            Lock Gaze on Comet (Smooth Pursuit)
          </span>
        </div>

        {/* Player Spaceship (Steered by Joystick to test DCD Motor Tremor) */}
        <div 
          style={{ left: '22%', top: `${shipY}%` }}
          className="absolute z-25 -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.8)] rotate-45 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white -rotate-45" />
            </div>
            {/* Thruster exhaust */}
            <div className="absolute -left-3 w-4 h-2 bg-purple-400 blur-[2px] animate-pulse"></div>
          </div>
          <span className="text-[10px] font-tech text-purple-300 bg-black/70 px-2 py-0.5 rounded border border-purple-500/30 -ml-4 mt-2 block whitespace-nowrap">
            Joystick Ship (Steer Straight)
          </span>
        </div>

        {/* Real-time Tremor Oscilloscope Preview */}
        <div className="absolute bottom-4 left-4 z-20 bg-black/70 backdrop-blur-sm border border-purple-500/30 px-3 py-2 rounded-lg w-64">
          <div className="flex items-center justify-between text-[11px] font-tech text-purple-300 mb-1">
            <span>JOYSTICK TREMOR VARIANCE:</span>
            <span className="font-mono text-emerald-400">0.06 σ</span>
          </div>
          {/* Micro-tremor waveform visualization */}
          <div className="h-6 flex items-center gap-0.5">
            {[4, 6, 5, 8, 12, 6, 7, 10, 5, 14, 6, 7, 5, 9, 6, 8, 11, 5, 7, 6, 5, 9, 7].map((height, idx) => (
              <div 
                key={idx}
                style={{ height: `${height}px` }}
                className={`w-1 rounded-full ${height > 10 ? 'bg-amber-400' : 'bg-purple-400/80'}`}
              />
            ))}
          </div>
        </div>

        {/* Dual-Task Instruction Overlay */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1 text-[11px] font-tech bg-black/60 backdrop-blur-sm border border-purple-500/20 px-3 py-2 rounded">
          <span className="text-purple-300 font-semibold uppercase">Dual-Sensory Challenge</span>
          <span className="text-slate-300">1. Eyes follow the glowing comet across</span>
          <span className="text-slate-300">2. Hand holds ship steady inside corridor</span>
        </div>

      </div>

      {/* Screen Controls & Simulation Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShipY(prev => Math.max(25, prev - 8))}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech uppercase"
          >
            Steer Up (▲)
          </button>
          <button
            onClick={() => setShipY(prev => Math.min(75, prev + 8))}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech uppercase"
          >
            Steer Down (▼)
          </button>
          <button
            onClick={handleSimulateTremorSpike}
            className="px-3 py-1.5 rounded bg-purple-950 border border-purple-500/40 text-purple-300 hover:bg-purple-900 text-xs font-tech uppercase"
          >
            Simulate Jitter Spike
          </button>
        </div>

        <button
          onClick={completeStage2}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-emerald-500 text-black font-orbitron font-bold text-xs uppercase tracking-wider shadow-lg"
        >
          <span>View Neuro-Motor Card</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
