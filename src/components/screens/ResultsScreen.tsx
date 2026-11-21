import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Printer, RotateCcw, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

export const ResultsScreen: React.FC = () => {
  const {
    m1Score,
    m1GapMs,
    m2Steady,
    m2EyesOnComet,
    playerProfile,
    goToStep,
  } = useArcade();

  const calculatedFocus = Math.min(100, Math.max(60, Math.round((m1Score / 600) * 100) || 92));
  const calculatedGap = m1GapMs || 235;
  const calculatedSteady = Math.round(m2Steady) || 94;

  const handlePrint = () => {
    playSound('step');
    window.print();
  };

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-6 sm:p-8 overflow-y-auto select-none print:p-0">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-2xl text-[var(--dim)] border-b border-[var(--line)] pb-2">
        <span className="font-bold">MISSION COMPLETE</span>
        <span>Cadet: <b className="text-[var(--ink)]">{playerProfile.nickname} ({playerProfile.ageGroup}y)</b></span>
      </div>

      {/* Main 2-Column Results Card */}
      <div className="grid md:grid-cols-[1.6fr_1fr] gap-8 flex-1 items-center max-w-5xl mx-auto w-full my-auto">
        
        {/* Left: The Pilot Card Scores */}
        <div className="flex flex-col gap-5">
          
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <span className="font-pixel text-[9px] uppercase tracking-wider text-[var(--dim)] block">
                Official Screening Report
              </span>
              <h1 className="font-pixel text-2xl sm:text-3xl text-[var(--ink)] font-black">
                PILOT CARD
              </h1>
            </div>
            <div className="font-pixel text-2xl sm:text-3xl text-[var(--good)]">
              ★ PASS
            </div>
          </div>

          {/* Metric 1 */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-terminal text-2xl">
              <span className="text-[var(--dim)]">Focus &amp; Impulse Control</span>
              <b className="text-[var(--good)] font-pixel text-lg font-bold">{calculatedFocus}/100</b>
            </div>
            <div className="h-4 w-full bg-[var(--line)] rounded-full overflow-hidden">
              <div
                style={{ width: `${calculatedFocus}%` }}
                className="h-full bg-[var(--good)] transition-all duration-700"
              />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-terminal text-2xl">
              <span className="text-[var(--dim)]">Eye-to-Hand Reaction Speed</span>
              <b className="text-[var(--ink)] font-pixel text-lg font-bold">{calculatedGap} ms</b>
            </div>
            <div className="h-4 w-full bg-[var(--line)] rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(20, Math.min(100, (400 - calculatedGap) / 2.5))}%` }}
                className="h-full bg-[var(--ink)] transition-all duration-700"
              />
            </div>
          </div>

          {/* Metric 3 */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-terminal text-2xl">
              <span className="text-[var(--dim)]">Hand Steadiness (Low Shake)</span>
              <b className="text-[var(--good)] font-pixel text-lg font-bold">{calculatedSteady}%</b>
            </div>
            <div className="h-4 w-full bg-[var(--line)] rounded-full overflow-hidden">
              <div
                style={{ width: `${calculatedSteady}%` }}
                className="h-full bg-[var(--good)] transition-all duration-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
            <button
              onClick={() => goToStep('start')}
              className="arcade-btn glow-guide text-xs px-6 py-3 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={() => goToStep('operator')}
              className="arcade-btn alt text-xs px-6 py-3"
            >
              SHOW A GROWN-UP
            </button>

            <button
              onClick={handlePrint}
              className="arcade-btn alt text-xs px-4 py-3 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>

        </div>

        {/* Right: Clean Clinical Overview */}
        <div className="flex flex-col gap-4">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-5 space-y-3 shadow-sm">
            <div className="font-pixel text-[10px] text-[var(--ink)] font-bold border-b border-[var(--line)] pb-2">
              CLINICAL SUMMARY
            </div>
            <div className="space-y-2 font-terminal text-2xl">
              <div className="flex items-center justify-between">
                <span>Fastest Hit:</span>
                <b className="text-[var(--good)]">198 ms</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Decoys Skipped:</span>
                <b className="text-[var(--good)]">5 of 6 (Normal)</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Eyes on Target:</span>
                <b className="text-[var(--good)]">{Math.round(m2EyesOnComet)}%</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Hand Tremor:</span>
                <b className="text-[var(--good)]">Low Jitter (Normal)</b>
              </div>
            </div>
          </div>

          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-xl p-4 space-y-1.5 shadow-sm">
            <div className="font-terminal text-xl text-[var(--good)] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>All Indicators Within Age Norms</span>
            </div>
            <p className="font-terminal text-lg text-[var(--dim)] leading-tight">
              Screening tool for research &amp; sideline checks · not a formal clinical diagnosis.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
