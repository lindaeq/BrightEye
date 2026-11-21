import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Download, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';

export const OperatorScreen: React.FC = () => {
  const { recentRuns, exportRunsCSV, goToStep } = useArcade();

  return (
    <div className="flex flex-col h-full justify-between gap-3 p-3 sm:p-5 overflow-y-auto select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>Operator dashboard</span>
        <span>Staff only · Step 9 of 9</span>
      </div>

      {/* Main 2-Column Operator Layout */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-4 sm:gap-6 flex-1 items-stretch my-auto">
        
        {/* Left: Recent Runs Table & Actions */}
        <div className="flex flex-col justify-between gap-3">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 flex-1 flex flex-col">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1 mb-2">
              Recent Clinical Participant Runs
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 gap-2 border-b-2 border-[var(--line)] pb-1 font-terminal text-xs text-[var(--dim)] font-bold">
              <span>Run</span>
              <span>Age</span>
              <span>Focus</span>
              <span>Gap</span>
              <span>Steady</span>
              <span>Flag</span>
            </div>

            {/* Table Body */}
            <div className="font-terminal text-sm divide-y divide-[var(--line)] overflow-y-auto max-h-[220px] flex-1">
              {recentRuns.map((run) => (
                <div key={run.id} className="grid grid-cols-6 gap-2 py-1 items-center">
                  <span className="font-bold text-[var(--ink)]">{run.id}</span>
                  <span>{run.age}</span>
                  <span>{run.focusScore}</span>
                  <span>{run.gapMs}ms</span>
                  <span>{run.steadyPct}%</span>
                  <b className={run.status === 'OK' ? 'text-[var(--good)]' : 'text-[var(--bad)]'}>
                    {run.status}
                  </b>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={exportRunsCSV}
              className="arcade-btn font-pixel text-xs py-2 px-4 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>

            <button
              onClick={() => goToStep('warmup')}
              className="arcade-btn alt font-pixel text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RE-CALIBRATE</span>
            </button>

            <button
              onClick={() => goToStep('start')}
              className="arcade-btn alt font-pixel text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>END SESSION</span>
            </button>
          </div>

        </div>

        {/* Right: Hardware Telemetry & Cloud Storage */}
        <div className="flex flex-col justify-between gap-3">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Hardware Telemetry Link
            </div>
            <div className="font-terminal text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Pi 5 · QNX RTOS</span>
                <b className="text-[var(--good)]">60 fps Locked</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Timing Jitter</span>
                <b className="text-[var(--good)]">&lt; 1 ms (Deterministic)</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Uno Q Arcade</span>
                <b className="text-[var(--good)]">Online (115200)</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Display · buzzer</span>
                <b className="text-[var(--good)]">OK (PWM Audio)</b>
              </div>
            </div>
          </div>

          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 space-y-1">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              TigerData Health Cloud
            </div>
            <div className="font-terminal text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span>Last sync</span>
                <b className="text-[var(--ink)]">12 s ago</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync Queue</span>
                <b className="text-[var(--good)]">0 Pending</b>
              </div>
            </div>
            <p className="font-terminal text-xs text-[var(--dim)] pt-2 border-t border-[var(--line)]">
              Screening aid only · not a formal clinical diagnosis.
            </p>
          </div>

        </div>

      </div>

      {/* Ground strip */}
      <div className="h-1.5 bg-[var(--dim)] rounded-sm w-full opacity-60"></div>

    </div>
  );
};
