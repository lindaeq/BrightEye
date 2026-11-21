import React from 'react';
import { useGame } from '../../context/GameContext';
import { 
  ShieldCheck, 
  Eye, 
  Gamepad2, 
  Activity, 
  Sparkles, 
  Play, 
  Cpu, 
  Compass,
  HeartPulse
} from 'lucide-react';

export const AttractScreen: React.FC = () => {
  const { startKioskSession, setScreen } = useGame();

  return (
    <div className="relative min-h-[calc(100vh-105px)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Banner / Problem Statement */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-tech tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Pediatric Neuro-Motor Screening System
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black font-orbitron tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,243,255,0.4)]">
          SPACE ARCADE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">NEURO KIOSK</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg font-light leading-relaxed">
          A 30-second rapid screening kiosk measuring <span className="text-cyan-300 font-semibold">visual reaction time (eyes)</span> vs.{' '}
          <span className="text-purple-300 font-semibold">motor execution & tremor (hand)</span> to detect hidden pediatric conditions like <span className="text-white font-medium underline decoration-cyan-500/50">DCD / Dyspraxia</span>, <span className="text-white font-medium underline decoration-purple-500/50">ADHD</span>, and <span className="text-white font-medium underline decoration-pink-500/50">youth concussions</span>.
        </p>
      </div>

      {/* The 30-Second Gameplay Loop Breakdown */}
      <div className="grid md:grid-cols-3 gap-6 my-6">
        
        {/* Stage 1 Preview Card */}
        <div className="group relative rounded-xl border border-cyan-900/60 bg-gradient-to-b from-[#0c142c] to-[#070b18] p-6 shadow-lg hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-tech text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded uppercase">
              15 SECONDS
            </span>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-orbitron text-white mb-2">Stage 1: Target Lock</h2>
          <p className="text-xs font-tech text-cyan-300 mb-3 uppercase tracking-wide">
            Eye-to-Hand Latency & Impulse Control
          </p>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>• <strong className="text-white">What happens:</strong> Glowing alien targets pop up randomly with occasional red decoy flashes to test impulse control.</li>
            <li>• <strong className="text-white">QNX Camera:</strong> Timestamps exact millisecond eyes snap to target (<span className="text-cyan-300 font-mono">t_eye</span>).</li>
            <li>• <strong className="text-white">Joystick:</strong> Measures crosshair steer & click time (<span className="text-purple-300 font-mono">t_hand</span>).</li>
            <li>• <strong className="text-white">Live Feedback:</strong> 7-segment display flashes reaction gap (<span className="text-cyan-400 font-mono">Δt</span> in ms).</li>
          </ul>
        </div>

        {/* Stage 2 Preview Card */}
        <div className="group relative rounded-xl border border-purple-900/60 bg-gradient-to-b from-[#140c2c] to-[#070b18] p-6 shadow-lg hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-tech text-purple-400 bg-purple-950/70 border border-purple-500/30 px-2 py-0.5 rounded uppercase">
              15 SECONDS
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-orbitron text-white mb-2">Stage 2: Asteroid Tunnel</h2>
          <p className="text-xs font-tech text-purple-300 mb-3 uppercase tracking-wide">
            Smooth Pursuit & Motor Tremor Check
          </p>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>• <strong className="text-white">What happens:</strong> Follow a smooth traversing comet with eyes while guiding a ship through a narrow corridor.</li>
            <li>• <strong className="text-white">QNX Camera:</strong> Tracks smooth pursuit vs jerky saccadic intrusions.</li>
            <li>• <strong className="text-white">Joystick:</strong> Measures high-frequency micro-shaking (intention tremor / DCD motor jitter) and corridor deviation.</li>
          </ul>
        </div>

        {/* End-of-Run Card */}
        <div className="group relative rounded-xl border border-emerald-900/60 bg-gradient-to-b from-[#081d22] to-[#070b18] p-6 shadow-lg hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-tech text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
              INSTANT RESULT
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-orbitron text-white mb-2">Neuro-Motor Card</h2>
          <p className="text-xs font-tech text-emerald-300 mb-3 uppercase tracking-wide">
            Clinical Diagnostic Metrics
          </p>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>• <strong className="text-white">Visual Focus Score:</strong> Impulse control & fixation rating (e.g. 92/100).</li>
            <li>• <strong className="text-white">Eye-to-Hand Latency:</strong> Deterministic reaction speed (e.g. 235 ms).</li>
            <li>• <strong className="text-white">Motor Steadiness:</strong> Tremor variance index (e.g. Low Jitter 94%).</li>
            <li>• <strong className="text-white">Kid-Friendly Badge:</strong> Gamified status report for school clinics and sports sidelines.</li>
          </ul>
        </div>

      </div>

      {/* Hardware Architecture Split & Prize Track Matrix */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0a0e20]/60 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-orbitron font-semibold text-sm text-white flex items-center gap-2">
              Raspberry Pi 5 (QNX RTOS)
              <span className="text-[10px] bg-cyan-900/50 text-cyan-300 px-2 py-0.2 rounded font-tech">
                Vision & Timing Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic real-time landmark/gaze detection (<span className="text-cyan-300 font-mono">gx, gy</span>) with hardware timestamps. Pediatric video remains 100% offline & private.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#0a0e20]/60 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-orbitron font-semibold text-sm text-white flex items-center gap-2">
              Arduino Uno Q + Arcade Deck
              <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-2 py-0.2 rounded font-tech">
                Tactile UI & Telemetry
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reads analog joystick coordinates & tactile fire button, drives physical 7-segment reaction display and piezo buzzer feedback.
            </p>
          </div>
        </div>

      </div>

      {/* Arcade Kiosk Start Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        
        <button
          onClick={startKioskSession}
          className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-black font-orbitron font-bold text-base tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(0,243,255,0.5)] hover:shadow-[0_0_35px_rgba(0,243,255,0.8)] hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <Play className="w-5 h-5 fill-black" />
          <span>START 30-SECOND NEURO TEST</span>
        </button>

        <button
          onClick={() => setScreen('CALIBRATION')}
          className="px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-tech uppercase tracking-wider text-sm transition-all flex items-center gap-2"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Sensors Calibration</span>
        </button>

      </div>

      {/* Privacy & Health Notice */}
      <div className="mt-6 flex flex-wrap items-center justify-between text-[11px] font-tech text-slate-400 border-t border-slate-900 pt-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Offline QNX Edge Computing — No Pediatric Camera Video Ever Transmitted</span>
        </div>
        <div className="flex items-center gap-2">
          <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
          <span>Pediatric Dyspraxia (DCD) & ADHD Non-Invasive Screening Protocol</span>
        </div>
      </div>

    </div>
  );
};
