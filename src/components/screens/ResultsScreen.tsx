import React from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { Award, Printer, Share2, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

export const ResultsScreen: React.FC = () => {
  const {
    m1Score,
    m1GapMs,
    m2Steady,
    m2EyesOnComet,
    playerProfile,
    goToStep,
    saveCurrentRun,
    savedToTigerData,
  } = useArcade();

  const calculatedFocus = Math.min(100, Math.max(60, Math.round((m1Score / 600) * 100) || 92));
  const calculatedGap = m1GapMs || 235;
  const calculatedSteady = Math.round(m2Steady) || 94;

  const handlePrint = () => {
    playSound('step');
    window.print();
  };

  return (
    <div className="flex flex-col h-full justify-between gap-3 p-3 sm:p-5 overflow-y-auto select-none print:p-0">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>Mission complete</span>
        <span>Run #014 · Cadet: {playerProfile.nickname}</span>
      </div>

      {/* Main 2-Column Results Card */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-4 sm:gap-6 flex-1 items-start my-auto">
        
        {/* Left: The Pilot Card Scores */}
        <div className="flex flex-col gap-3">
          
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <div>
              <span className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] block">
                Official Cadet Performance
              </span>
              <h1 className="font-pixel text-lg sm:text-2xl text-[var(--a1)]">
                PILOT CARD
              </h1>
            </div>
            <div className="font-pixel text-2xl sm:text-3xl text-[var(--good)] animate-pulse">
              ★
            </div>
          </div>

          {/* Metric 1: Focus & Control */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-terminal text-sm sm:text-base">
              <span className="text-[var(--dim)]">Focus &amp; control · ignoring tricks</span>
              <b className="text-[var(--good)] text-lg sm:text-xl font-normal">{calculatedFocus}/100</b>
            </div>
            <div className="h-3 w-full bg-[var(--line)] rounded-[var(--r)] overflow-hidden">
              <div
                style={{ width: `${calculatedFocus}%` }}
                className="h-full bg-[var(--good)] transition-all duration-700"
              />
            </div>
          </div>

          {/* Metric 2: Eye-to-Hand Speed */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-terminal text-sm sm:text-base">
              <span className="text-[var(--dim)]">Eye-to-hand speed · lower is faster</span>
              <b className="text-[var(--ink)] text-lg sm:text-xl font-normal">{calculatedGap} ms</b>
            </div>
            <div className="h-3 w-full bg-[var(--line)] rounded-[var(--r)] overflow-hidden">
              <div
                style={{ width: `${Math.max(20, Math.min(100, (400 - calculatedGap) / 2.5))}%` }}
                className="h-full bg-[var(--ink)] transition-all duration-700"
              />
            </div>
          </div>

          {/* Metric 3: Steady Hands */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-terminal text-sm sm:text-base">
              <span className="text-[var(--dim)]">Steady hands · low shake</span>
              <b className="text-[var(--good)] text-lg sm:text-xl font-normal">{calculatedSteady}%</b>
            </div>
            <div className="h-3 w-full bg-[var(--line)] rounded-[var(--r)] overflow-hidden">
              <div
                style={{ width: `${calculatedSteady}%` }}
                className="h-full bg-[var(--good)] transition-all duration-700"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
            <button
              onClick={() => goToStep('start')}
              className="arcade-btn font-pixel text-xs py-2 px-4"
            >
              PLAY AGAIN
            </button>

            <button
              onClick={() => goToStep('operator')}
              className="arcade-btn alt font-pixel text-xs py-2 px-4"
            >
              SHOW A GROWN-UP
            </button>

            <button
              onClick={handlePrint}
              className="arcade-btn alt font-terminal text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
          </div>

        </div>

        {/* Right: Clinical Details & Cloud Sync */}
        <div className="flex flex-col gap-3">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Assessment Details
            </div>
            <div className="font-terminal text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Fastest hit</span>
                <b className="text-[var(--good)]">198 ms</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Tricks skipped</span>
                <b className="text-[var(--good)]">5 of 6 (ADHD Normal)</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Eyes on comet</span>
                <b className="text-[var(--good)]">{Math.round(m2EyesOnComet)}%</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Hand shake</span>
                <b className="text-[var(--good)]">Low Jitter (DCD Normal)</b>
              </div>
            </div>
          </div>

          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-3 space-y-1">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              TigerData Cloud Link
            </div>
            <div className="font-terminal text-sm text-[var(--good)] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sent to TigerData Research DB</span>
            </div>
            <p className="font-terminal text-xs text-[var(--dim)] pt-1">
              Screening aid only · not a diagnostic medical device.
            </p>
          </div>

        </div>

      </div>

      {/* Ground strip */}
      <div className="h-1.5 bg-[var(--dim)] rounded-sm w-full opacity-60"></div>

    </div>
  );
};
