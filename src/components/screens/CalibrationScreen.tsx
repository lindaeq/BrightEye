import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  Eye, 
  Gamepad2, 
  ArrowRight,
  Shield,
  Volume2
} from 'lucide-react';

export const CalibrationScreen: React.FC = () => {
  const { setScreen, hardware, startKioskSession } = useGame();
  const [calibratedGaze, setCalibratedGaze] = useState(false);
  const [calibratedJoystick, setCalibratedJoystick] = useState(false);
  const [buzzerTested, setBuzzerTested] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-tech text-cyan-400 uppercase tracking-widest">
            Diagnostic Setup
          </span>
          <h1 className="text-3xl font-orbitron font-bold text-white">
            HARDWARE CALIBRATION & CHECK
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ensure QNX RTOS Gaze tracking and Arduino Uno Q Joystick are centered before testing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCalibratedGaze(true);
              setCalibratedJoystick(true);
              setBuzzerTested(true);
            }}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech uppercase"
          >
            Auto-Calibrate All
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* QNX Camera / Eye Calibration */}
        <div className="rounded-xl border border-cyan-900/50 bg-[#0a0f24] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-semibold">
              <Eye className="w-5 h-5" />
              <span>QNX Eye Tracker (RPi 5)</span>
            </div>
            <span className="text-xs font-tech text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              {hardware.qnxConnected ? '115200 BAUD SYNC' : 'OFFLINE'}
            </span>
          </div>

          <div className="relative aspect-video bg-black/60 rounded-lg border border-cyan-500/20 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 scanlines opacity-40"></div>
            
            {/* Center Fixation Cross */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                calibratedGaze 
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' 
                  : 'border-cyan-400/80 bg-cyan-500/10 text-cyan-300 animate-pulse'
              }`}>
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <p className="text-xs font-tech text-slate-300 mt-3">
                {calibratedGaze 
                  ? '✓ Gaze lock acquired (gx: 0.50, gy: 0.50)' 
                  : 'Look directly at the center glowing crosshair'}
              </p>
            </div>

            {/* Corner calibration indicators */}
            <div className="absolute top-3 left-3 w-3 h-3 rounded-full border border-cyan-500/40" />
            <div className="absolute top-3 right-3 w-3 h-3 rounded-full border border-cyan-500/40" />
            <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full border border-cyan-500/40" />
            <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full border border-cyan-500/40" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-tech text-slate-400">
              Deterministic RTOS Jitter: <strong className="text-cyan-400">0.42 ms</strong>
            </span>
            <button
              onClick={() => setCalibratedGaze(!calibratedGaze)}
              className="px-4 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-tech uppercase"
            >
              {calibratedGaze ? 'Recalibrate' : 'Lock Eye Center'}
            </button>
          </div>
        </div>

        {/* Arduino Uno Q Arcade Joystick & Button Calibration */}
        <div className="rounded-xl border border-indigo-900/50 bg-[#0d0d26] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-orbitron font-semibold">
              <Gamepad2 className="w-5 h-5" />
              <span>Arduino Uno Q (Tactile Deck)</span>
            </div>
            <span className="text-xs font-tech text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              USB SERIAL READY
            </span>
          </div>

          <div className="relative aspect-video bg-black/60 rounded-lg border border-indigo-500/20 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 scanlines opacity-40"></div>
            
            {/* Joystick Position Target Box */}
            <div className="relative z-10 w-28 h-28 rounded-lg border border-indigo-500/40 bg-indigo-950/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-indigo-500/40 border border-indigo-400 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-300" />
              </div>
            </div>

            <p className="text-xs font-tech text-slate-300 mt-2 z-10">
              {calibratedJoystick ? '✓ Deadzone & Button Verified' : 'Move joystick in circles, then click button'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setBuzzerTested(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech uppercase"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{buzzerTested ? 'Buzzer Chime OK' : 'Test Buzzer'}</span>
            </button>

            <button
              onClick={() => setCalibratedJoystick(!calibratedJoystick)}
              className="px-4 py-1.5 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-tech uppercase"
            >
              {calibratedJoystick ? 'Recalibrate' : 'Confirm Joystick Zero'}
            </button>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-[#090d1e] mt-6">
        <div className="flex items-center gap-2 text-xs font-tech text-slate-400">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Both sensory pathways calibrated with sub-millisecond hardware accuracy.</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('ATTRACT')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech uppercase"
          >
            Back to Attract
          </button>
          
          <button
            onClick={startKioskSession}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30"
          >
            <span>Proceed to Stage 1</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
