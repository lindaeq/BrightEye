import React, { useEffect, useState } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { CheckCircle2, RefreshCw } from 'lucide-react';

const CALIBRATION_POINTS = [
  { id: 1, label: 'Top Left', left: '10%', top: '15%' },
  { id: 2, label: 'Top Right', left: '90%', top: '15%' },
  { id: 3, label: 'Bottom Left', left: '10%', top: '85%' },
  { id: 4, label: 'Bottom Right', left: '90%', top: '85%' },
  { id: 5, label: 'Center', left: '50%', top: '50%' },
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

  return (
    <div className="flex flex-col h-full justify-between gap-4 p-4 sm:p-6 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between font-terminal text-xs sm:text-sm text-[var(--dim)] uppercase tracking-wider border-b border-[var(--line)] pb-1">
        <span>Warm-up · Eye calibration</span>
        <span>Step 4 of 9</span>
      </div>

      {/* Main 2-Column Calibration Layout */}
      <div className="grid md:grid-cols-[1.7fr_1fr] gap-4 sm:gap-6 flex-1 items-stretch my-auto">
        
        {/* Left Column: Calibration Arena */}
        <div className="flex flex-col gap-2 min-h-[280px]">
          <h1 className="font-pixel text-sm sm:text-lg text-[var(--a1)]">
            FOLLOW THE DOT WITH YOUR EYES
          </h1>

          {/* Interactive Calibration Field */}
          <div className="relative flex-1 rounded-[var(--r)] border-2 border-[var(--dim)] bg-[var(--fld)] overflow-hidden min-h-[220px] shadow-inner select-none">
            
            {/* Grid texture */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(var(--line)_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>

            {/* 5 Calibration Targets */}
            {CALIBRATION_POINTS.map((pt) => {
              const isActive = pt.id === calibrationPoint;
              const isPast = pt.id < calibrationPoint || isCalibrated;

              return (
                <div
                  key={pt.id}
                  onClick={isActive ? advanceCalibration : undefined}
                  style={{ left: pt.left, top: pt.top }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                    isActive ? 'scale-125 z-20' : 'scale-90 z-10'
                  }`}
                >
                  <div
                    className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[var(--good)] shadow-[0_0_15px_var(--good)] animate-pulse'
                        : isPast
                        ? 'bg-[var(--dim)] opacity-40'
                        : 'bg-[var(--line)] opacity-25'
                    }`}
                  >
                    {isPast && !isActive && (
                      <span className="text-[10px] font-pixel text-[var(--on)]">✓</span>
                    )}
                    {isActive && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--scr)] animate-ping" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Center Status Toast */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
              <span className="font-terminal text-xs sm:text-sm bg-[var(--scr)]/90 border border-[var(--dim)] px-3 py-1 rounded text-[var(--ink)] shadow">
                {isCalibrated ? (
                  <b className="text-[var(--good)]">✓ EYE CALIBRATION COMPLETE! CLICK CONTINUE</b>
                ) : (
                  <span>Look directly at the pulsing dot (Point {calibrationPoint} of 5)</span>
                )}
              </span>
            </div>

          </div>

          <div className="font-terminal text-xs text-[var(--dim)] flex items-center justify-between">
            <span>Point {Math.min(5, calibrationPoint)} of 5 · Keep head still</span>
            <span className="text-[var(--good)] font-bold">
              {isCalibrated ? 'Accuracy: 98%' : `Tracking: ${Math.round(simulatedAccuracy)}%`}
            </span>
          </div>
        </div>

        {/* Right Column: Telemetry Checks & Buttons */}
        <div className="flex flex-col justify-between gap-3">
          
          <div className="border-2 border-[var(--dim)] bg-[var(--fld)] rounded-[var(--r)] p-4 space-y-2">
            <div className="font-terminal text-xs uppercase tracking-widest text-[var(--dim)] font-bold border-b border-[var(--line)] pb-1">
              Sensor Verification
            </div>
            
            <div className="font-terminal text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span>Camera</span>
                <b className="text-[var(--good)] flex items-center gap-1">
                  60 fps <CheckCircle2 className="w-3.5 h-3.5" />
                </b>
              </div>
              <div className="flex items-center justify-between">
                <span>Face lock</span>
                <b className="text-[var(--good)]">Found (Gaze Centered)</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Eye accuracy</span>
                <b className="text-[var(--good)]">{Math.min(98, Math.round(simulatedAccuracy))}%</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Joystick</span>
                <b className="text-[var(--good)]">Centered</b>
              </div>
              <div className="flex items-center justify-between">
                <span>Pi 5 link</span>
                <b className="text-[var(--good)]">115200 baud QNX</b>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={nextStep}
              className="arcade-btn font-pixel text-xs py-3 w-full"
            >
              CONTINUE →
            </button>

            <button
              onClick={resetCalibration}
              className="arcade-btn alt font-terminal text-xs py-2 w-full flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REDO CALIBRATION</span>
            </button>
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
        <span className="font-terminal text-xs text-[var(--dim)]">
          Deterministic QNX RTOS timestamping active
        </span>
        <button
          onClick={advanceCalibration}
          className="font-terminal text-xs text-[var(--dim)] hover:text-[var(--ink)] underline cursor-pointer"
        >
          {isCalibrated ? 'Calibrated ✓' : 'Simulate Eye Snap (Next Point)'}
        </button>
      </div>

    </div>
  );
};
