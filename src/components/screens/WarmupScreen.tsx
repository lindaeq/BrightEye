import React, { useEffect, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { CheckCircle2, RefreshCw, Eye, ArrowRight, Target } from 'lucide-react';
import { playSound } from '../../utils/audio';

const CALIBRATION_POINTS = [
  { id: 1, label: 'TOP-LEFT CORNER', left: '8%', top: '14%' },
  { id: 2, label: 'TOP-RIGHT CORNER', left: '92%', top: '14%' },
  { id: 3, label: 'BOTTOM-LEFT CORNER', left: '8%', top: '86%' },
  { id: 4, label: 'BOTTOM-RIGHT CORNER', left: '92%', top: '86%' },
  { id: 5, label: 'CENTER FIXATION', left: '50%', top: '50%' },
];

export const WarmupScreen: React.FC = () => {
  const {
    calibrationPoint,
    advanceCalibration,
    isCalibrated,
    resetCalibration,
    nextStep,
  } = useArcade();

  const [simulatedAccuracy, setSimulatedAccuracy] = useState(82);

  useEffect(() => {
    setSimulatedAccuracy(80 + calibrationPoint * 3.8);
  }, [calibrationPoint]);

  const handleDotHit = () => {
    playSound('blip');
    advanceCalibration();
  };

  const currentPtInfo = CALIBRATION_POINTS[calibrationPoint - 1] || CALIBRATION_POINTS[4];

  return (
    <div className="flex flex-col h-full w-full justify-between gap-1 p-3 overflow-hidden select-none">
      
      {/* Slim Top Bar: Instructions & Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[var(--fld)] rounded-xl border border-[var(--dim)] font-ui text-sm font-semibold">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-[var(--good)] animate-pulse" />
          <span className="font-heading font-bold text-sm sm:text-base text-[var(--ink)] uppercase">
            Eye Calibration
          </span>
          <span className="text-[var(--dim)]">·</span>
          <span className="font-bold text-[var(--good)]">
            {isCalibrated ? 'CALIBRATION COMPLETE ✓' : currentPtInfo.label}
          </span>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4 text-sm font-bold">
          <span>Camera: <b className="text-[var(--good)]">60 FPS</b></span>
          <span>Tracking: <b className="text-[var(--good)]">{Math.min(98, Math.round(simulatedAccuracy))}%</b></span>
          <span>Point: <b className="text-[var(--btn)] font-heading text-base">{Math.min(5, calibrationPoint)}/5</b></span>
        </div>
      </div>

      {/* Screen-Filling Calibration Field */}
      <div className="relative flex-1 w-full rounded-2xl border-3 border-[var(--dim)] bg-[var(--fld)] overflow-hidden shadow-inner my-1">
        
        {/* Center Target Crosshairs for orientation */}
        <div className="absolute inset-x-0 top-1/2 border-t border-[var(--line)] opacity-40 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 border-l border-[var(--line)] opacity-40 pointer-events-none" />

        {/* 5 Massive Spaced Calibration Targets */}
        {CALIBRATION_POINTS.map((pt) => {
          const isActive = pt.id === calibrationPoint && !isCalibrated;
          const isPast = pt.id < calibrationPoint || isCalibrated;

          return (
            <div
              key={pt.id}
              onClick={isActive ? handleDotHit : undefined}
              style={{ left: pt.left, top: pt.top }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                isActive ? 'scale-125 z-30' : 'scale-100 z-10'
              }`}
            >
              <div
                className={`relative flex items-center justify-center transition-all ${
                  isActive
                    ? 'w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[var(--btn)] shadow-[0_0_30px_var(--glow-color)] ring-4 ring-white/50'
                    : isPast
                    ? 'w-12 h-12 rounded-full bg-[var(--good)] opacity-60'
                    : 'w-10 h-10 rounded-full bg-[var(--line)] opacity-40'
                }`}
              >
                {/* Rippling Concentric Radar Rings */}
                {isActive && (
                  <>
                    <div className="absolute -inset-4 rounded-full border-3 border-[var(--btn)] animate-ping opacity-60" />
                    <div className="absolute -inset-8 rounded-full border-2 border-[var(--btn)] opacity-30" />
                    <Target className="w-8 h-8 text-[var(--btnink)] animate-pulse" />
                  </>
                )}

                {/* Checked Past Target */}
                {isPast && !isActive && (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Target Label */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                <span className={`font-heading text-xs font-bold px-3 py-1 rounded-full shadow ${
                  isActive
                    ? 'bg-[var(--btn)] text-[var(--btnink)] ring-2 ring-white/40'
                    : 'bg-black/40 text-white opacity-80'
                }`}>
                  {isActive ? 'CLICK OR GAZE HERE' : `POINT ${pt.id}`}
                </span>
              </div>
            </div>
          );
        })}

        {/* Instruction Toast */}
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-20">
          <div className="bg-[var(--scr)] border-2 border-[var(--dim)] px-5 py-2.5 rounded-full shadow-xl font-ui text-base font-bold text-[var(--ink)] flex items-center gap-2">
            {isCalibrated ? (
              <span className="text-[var(--good)] flex items-center gap-2 font-heading text-base font-extrabold">
                <CheckCircle2 className="w-5 h-5" /> ALL 5 POINTS CALIBRATED! CLICK CONTINUE
              </span>
            ) : (
              <span>
                Look directly at <b className="text-[var(--btn)]">{currentPtInfo.label}</b>. Click the dot to lock.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Action Footer with Glowing Continue Button */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--line)] font-ui text-base font-bold">
        <button
          onClick={resetCalibration}
          className="arcade-btn alt text-sm py-2 px-4 flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Calibration</span>
        </button>

        {/* Glowing Path Button: Lights up strongly when calibration is done! */}
        <button
          onClick={nextStep}
          className={`arcade-btn flex items-center gap-2.5 px-8 py-3 ${
            isCalibrated ? 'glow-guide scale-105' : ''
          }`}
        >
          <span>CONTINUE TO MISSIONS</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
