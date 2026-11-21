import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  Eye, 
  Gamepad2, 
  Target, 
  AlertTriangle, 
  Flame, 
  Timer, 
  ArrowRight,
  Crosshair
} from 'lucide-react';

export const Stage1TargetLock: React.FC = () => {
  const { completeStage1, metrics } = useGame();
  const [timeLeft, setTimeLeft] = useState(15);
  const [targetIndex, setTargetIndex] = useState(1);
  const [targetPos, setTargetPos] = useState({ x: 45, y: 35 });
  const [crosshairPos, setCrosshairPos] = useState({ x: 50, y: 50 });
  const [isDecoy, setIsDecoy] = useState(false);
  const [lastGapMs, setLastGapMs] = useState(240);
  const [hitFeedback, setHitFeedback] = useState<string | null>(null);

  // 15-second game countdown loop framework
  useEffect(() => {
    if (timeLeft <= 0) {
      completeStage1();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, completeStage1]);

  // Framework action to simulate target acquisition & latency calculation
  const handleSimulateHit = (decoy: boolean) => {
    if (decoy) {
      setHitFeedback('IMPULSE ERROR! Decoy Hit (-50 pts)');
      setTimeout(() => setHitFeedback(null), 1500);
    } else {
      const simulatedTEye = Math.floor(Math.random() * 40 + 110); // ~110-150ms saccade
      const simulatedTHand = Math.floor(Math.random() * 60 + 320); // ~320-380ms hand click
      const gap = simulatedTHand - simulatedTEye;
      setLastGapMs(gap);
      setHitFeedback(`TARGET LOCKED! Eye-to-Hand Gap: ${gap}ms`);
      setTimeout(() => setHitFeedback(null), 1200);

      // Spawn next target
      setTargetIndex(prev => prev + 1);
      setTargetPos({
        x: Math.floor(Math.random() * 60 + 20),
        y: Math.floor(Math.random() * 50 + 25),
      });
      setIsDecoy(Math.random() < 0.25); // 25% chance of decoy
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      
      {/* Top Arcade HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#0a0f26]/90 border border-cyan-900/60 p-3 rounded-xl">
        
        {/* Stage Timer */}
        <div className="flex items-center gap-3 border-r border-slate-800 pr-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Timer className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">TIME REMAINING</span>
            <div className="font-orbitron font-bold text-2xl text-cyan-300">
              {timeLeft}<span className="text-sm font-tech text-cyan-500">s</span>
            </div>
          </div>
        </div>

        {/* Target Count & Impulses */}
        <div className="flex items-center gap-3 border-r border-slate-800 pr-2">
          <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">TARGETS ACQUIRED</span>
            <div className="font-orbitron font-bold text-2xl text-indigo-300">
              {targetIndex} <span className="text-xs text-slate-500">/ 10</span>
            </div>
          </div>
        </div>

        {/* 7-Segment Reaction Gap (Live Hardware Feedback) */}
        <div className="flex items-center gap-3 border-r border-slate-800 pr-2">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">7-SEG REACTION GAP</span>
            <div className="seven-seg text-2xl font-bold text-emerald-300">
              {lastGapMs} <span className="text-xs font-tech text-emerald-500">ms</span>
            </div>
          </div>
        </div>

        {/* ADHD Impulse Monitor */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase">IMPULSE ERRORS</span>
            <div className="font-orbitron font-bold text-2xl text-rose-300">
              {metrics.stage1.decoyErrors} <span className="text-xs text-slate-500">decoys</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main 15-Second Space Arena / Target Lock Canvas */}
      <div className="relative aspect-[16/9] max-h-[580px] w-full bg-[#050814] rounded-2xl border-2 border-cyan-500/30 overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.15)] flex items-center justify-center">
        
        {/* CRT Scanline & Grid Background */}
        <div className="absolute inset-0 scanlines opacity-50"></div>
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00f3ff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Floating Telemetry Indicator Overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 text-[11px] font-tech bg-black/60 backdrop-blur-sm border border-cyan-500/20 px-3 py-2 rounded">
          <div className="flex items-center gap-2 text-cyan-400">
            <Eye className="w-3.5 h-3.5" />
            <span>QNX Camera t_eye: <strong className="text-white">124ms</strong></span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Joystick t_hand: <strong className="text-white">364ms</strong></span>
          </div>
          <div className="text-slate-400 text-[10px]">
            Δt Latency = t_hand - t_eye = <strong className="text-cyan-300">240ms</strong>
          </div>
        </div>

        {/* Decoy Alert Banner */}
        {isDecoy && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-rose-950/80 border border-rose-500/80 px-3 py-1.5 rounded animate-pulse text-rose-300 text-xs font-tech font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>DECOY DETECTED: DO NOT FIRE!</span>
          </div>
        )}

        {/* Hit Feedback Flash Toast */}
        {hitFeedback && (
          <div className="absolute top-1/4 z-30 px-6 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-orbitron font-bold text-sm tracking-wide shadow-2xl animate-bounce">
            {hitFeedback}
          </div>
        )}

        {/* Active Target (Alien Target or Decoy) */}
        <div 
          style={{ top: `${targetPos.y}%`, left: `${targetPos.x}%` }}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
          onClick={() => handleSimulateHit(isDecoy)}
        >
          <div className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-transform active:scale-95 ${
            isDecoy 
              ? 'bg-rose-600/20 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.8)]' 
              : 'bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,243,255,0.7)]'
          }`}>
            <div className={`w-8 h-8 rounded-full animate-ping opacity-60 ${isDecoy ? 'bg-rose-500' : 'bg-cyan-400'}`}></div>
            <div className="absolute font-orbitron font-extrabold text-xs text-white">
              {isDecoy ? 'DECOY' : 'TARGET'}
            </div>
          </div>
        </div>

        {/* Joystick Crosshair Simulation */}
        <div 
          style={{ top: `${crosshairPos.y}%`, left: `${crosshairPos.x}%` }}
          className="absolute z-25 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
        >
          <div className="relative w-12 h-12 flex items-center justify-center text-cyan-300 opacity-80">
            <Crosshair className="w-12 h-12 animate-pulse" />
          </div>
        </div>

        {/* Arena Controls Prompt */}
        <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2 z-20">
          <p className="text-xs font-tech text-slate-400 bg-black/70 px-4 py-1 rounded-full border border-slate-800">
            Click target above or press physical arcade button to record <span className="text-cyan-300 font-mono">t_hand</span>
          </p>
        </div>

      </div>

      {/* Screen Controls & Testing Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-tech text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>QNX Vision Deterministic Eye Tracker active</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSimulateHit(false)}
            className="px-4 py-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-tech uppercase"
          >
            Simulate Target Hit (235ms)
          </button>
          
          <button
            onClick={() => handleSimulateHit(true)}
            className="px-4 py-2 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-tech uppercase"
          >
            Simulate Decoy Trigger
          </button>

          <button
            onClick={completeStage1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-black font-orbitron font-bold text-xs uppercase tracking-wider shadow-lg"
          >
            <span>Proceed to Stage 2</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
