import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { 
  X, 
  Cpu, 
  Gamepad2, 
  Terminal, 
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({ isOpen, onClose }) => {
  const { hardware, setHardware, latestGaze, latestControl } = useGame();
  const [mockJitter, setMockJitter] = useState(0.04);
  const [mockLatency, setMockLatency] = useState(240);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#080c1d] border-l border-cyan-900/60 shadow-2xl z-50 flex flex-col p-5 overflow-y-auto">
      
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="font-orbitron font-bold text-sm text-white">HARDWARE & TELEMETRY</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5 text-xs font-tech">
        
        {/* Hardware Status Matrix */}
        <div className="space-y-2">
          <span className="text-slate-400 uppercase tracking-widest block font-semibold">
            Subsystem Status
          </span>
          
          {/* QNX RTOS Engine */}
          <div className="p-3 rounded-lg bg-[#0e142e] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Raspberry Pi 5 (QNX RTOS)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
                ONLINE
              </span>
            </div>
            <div className="text-slate-400 space-y-1 text-[11px]">
              <div>• Protocol: <span className="text-white">USB Serial (115200 baud)</span></div>
              <div>• Packet Format: <span className="text-cyan-300 font-mono">{"{t_eye, gx, gy, saccade}"}</span></div>
              <div>• Deterministic Clock: <span className="text-emerald-400">±0.42 ms jitter</span></div>
              <div>• Video Privacy: <span className="text-white">100% Offline / Local Landmark</span></div>
            </div>
          </div>

          {/* Arduino Arcade Deck */}
          <div className="p-3 rounded-lg bg-[#0e142e] border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                <Gamepad2 className="w-4 h-4 text-indigo-400" />
                Arduino Uno Q (Arcade Deck)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
                CONNECTED
              </span>
            </div>
            <div className="text-slate-400 space-y-1 text-[11px]">
              <div>• Inputs: <span className="text-white">Analog Joystick (jx, jy) + Fire Button</span></div>
              <div>• Outputs: <span className="text-white">7-Segment Display + Piezo Buzzer</span></div>
              <div>• Latency Calculation: <span className="text-cyan-300 font-mono">t_hand - t_eye</span></div>
            </div>
          </div>
        </div>

        {/* Live Packet Monitor (Raw Feed) */}
        <div className="space-y-2">
          <span className="text-slate-400 uppercase tracking-widest block font-semibold">
            Live Serial Feed (Raw JSON/CSV)
          </span>
          <div className="bg-black/80 rounded-lg p-3 font-mono text-[10px] text-cyan-300 border border-cyan-500/20 space-y-1 overflow-x-auto">
            <div className="text-slate-500">// QNX Gaze Packet</div>
            <div>
              {JSON.stringify({
                t_qnx_ms: 12480,
                gx: Number(latestGaze.gazeX.toFixed(3)),
                gy: Number(latestGaze.gazeY.toFixed(3)),
                saccade: latestGaze.saccadeDetected,
                conf: 0.98,
              })}
            </div>
            <div className="text-slate-500 pt-1">// Arduino Deck Packet</div>
            <div>
              {JSON.stringify({
                t_ard_ms: 12720,
                jx: Number(latestControl.joystickX.toFixed(2)),
                jy: Number(latestControl.joystickY.toFixed(2)),
                btn: false,
                jitter_var: mockJitter,
              })}
            </div>
          </div>
        </div>

        {/* Simulation Controls for Development */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <span className="text-slate-400 uppercase tracking-widest block font-semibold">
            Hardware Simulation Mode
          </span>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Simulated Latency Gap (Δt):</span>
              <span className="text-cyan-400 font-mono">{mockLatency} ms</span>
            </div>
            <input 
              type="range" 
              min="140" 
              max="450" 
              value={mockLatency}
              onChange={(e) => setMockLatency(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Tremor Variance (σ):</span>
              <span className="text-purple-400 font-mono">{mockJitter}</span>
            </div>
            <input 
              type="range" 
              min="0.01" 
              max="0.25" 
              step="0.01"
              value={mockJitter}
              onChange={(e) => setMockJitter(Number(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-300">Emulate Mock Hardware</span>
            <button
              onClick={() => setHardware(prev => ({ ...prev, mockMode: !prev.mockMode }))}
              className="text-cyan-400"
            >
              {hardware.mockMode ? (
                <ToggleRight className="w-6 h-6 text-cyan-400" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
