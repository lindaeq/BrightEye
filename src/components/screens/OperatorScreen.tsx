import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Download, RefreshCw, LogOut } from 'lucide-react';

export const OperatorScreen: React.FC = () => {
  const { recentRuns, exportRunsCSV, goToStep } = useArcade();

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-6 sm:p-8 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-2xl text-[var(--dim)] border-b border-[var(--line)] pb-2">
        <span className="font-bold">OPERATOR DASHBOARD</span>
        <span>Staff &amp; Research Access</span>
      </div>

      {/* Main 2-Column Operator Layout */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-8 flex-1 items-stretch max-w-5xl mx-auto w-full my-auto">
        
        {/* Left: Table of Runs */}
        <div className="flex flex-col justify-between gap-4">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-4 flex-1 flex flex-col shadow-sm">
            <div className="font-pixel text-[10px] text-[var(--ink)] font-bold border-b border-[var(--line)] pb-2 mb-3">
              RECENT PARTICIPANT SESSIONS
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 gap-2 border-b-2 border-[var(--line)] pb-2 font-pixel text-[9px] text-[var(--dim)] font-bold">
              <span>Run ID</span>
              <span>Age</span>
              <span>Focus</span>
              <span>Latency</span>
              <span>Steady</span>
              <span>Status</span>
            </div>

            {/* Table Body */}
            <div className="font-terminal text-2xl divide-y divide-[var(--line)] overflow-y-auto max-h-[260px] flex-1">
              {recentRuns.map((run) => (
                <div key={run.id} className="grid grid-cols-6 gap-2 py-2 items-center">
                  <span className="font-bold text-[var(--ink)]">{run.id}</span>
                  <span>{run.age}</span>
                  <span className="font-bold">{run.focusScore}</span>
                  <span>{run.gapMs}ms</span>
                  <span>{run.steadyPct}%</span>
                  <b className={run.status === 'OK' ? 'text-[var(--good)] font-bold' : 'text-[var(--bad)] font-bold'}>
                    {run.status}
                  </b>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportRunsCSV}
              className="arcade-btn glow-guide text-xs px-6 py-3 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT DATA (CSV)</span>
            </button>

            <button
              onClick={() => goToStep('warmup')}
              className="arcade-btn alt text-xs px-5 py-3 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RE-CALIBRATE</span>
            </button>

            <button
              onClick={() => goToStep('start')}
              className="arcade-btn alt text-xs px-5 py-3 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>END SESSION</span>
            </button>
          </div>

        </div>

        {/* Right: Hardware Telemetry */}
        <div className="flex flex-col justify-between gap-4">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-5 space-y-3 shadow-sm">
            <div className="font-pixel text-[10px] text-[var(--ink)] font-bold border-b border-[var(--line)] pb-2">
              HARDWARE DIAGNOSTICS
            </div>
            <div className="space-y-2 font-terminal text-2xl">
              <div className="flex items-center justify-between">
                <span>Raspberry Pi 5 (QNX):</span>
                <b className="text-[var(--good)]">60 FPS Locked</b>
              </div>
              <div className="flex items-center justify-between">
                <span>RTOS Clock Jitter:</span>
                <b className="text-[var(--good)]">&lt; 0.42 ms</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Arduino Uno Q:</span>
                <b className="text-[var(--good)]">115200 Baud Ready</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Display &amp; Audio:</span>
                <b className="text-[var(--good)]">Operational</b>
              </div>
            </div>
          </div>

          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-5 space-y-2 shadow-sm">
            <div className="font-pixel text-[10px] text-[var(--ink)] font-bold border-b border-[var(--line)] pb-2">
              DATA PRIVACY (QNX RTOS)
            </div>
            <div className="font-terminal text-xl space-y-1 text-[var(--dim)] leading-tight">
              <p>• Facial coordinates calculated in volatile RAM.</p>
              <p>• Zero pediatric video is saved on disk.</p>
              <p className="text-emerald-500 font-bold pt-1">✓ Sun Life Health Hack Compliant</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
