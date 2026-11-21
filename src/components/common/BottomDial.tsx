import React, { useRef, useState } from 'react';
import { useArcade, STEP_NAMES } from '../../context/ArcadeContext';

export const BottomDial: React.FC = () => {
  const { currentStep, goToStep } = useArcade();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalSteps = STEP_NAMES.length;

  const getStepFromPointer = (clientX: number): number => {
    if (!trackRef.current) return currentStep;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const step = Math.floor((x / rect.width) * totalSteps) + 1;
    return Math.max(1, Math.min(totalSteps, step));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const newStep = getStepFromPointer(e.clientX);
    goToStep(newStep);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newStep = getStepFromPointer(e.clientX);
    if (newStep !== currentStep) {
      goToStep(newStep);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' && currentStep < totalSteps) {
      goToStep(currentStep + 1);
    } else if (e.key === 'ArrowLeft' && currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  return (
    <div className="mt-3 w-full">
      {/* 9-Notch Dial Slider Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Arcade Kiosk Screen Step"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="dial-track relative grid grid-cols-9 h-12 sm:h-14 bg-[var(--dial)] outline-none transition-all shadow-inner border border-black/20"
      >
        {/* Sliding Thumb Indicator */}
        <div
          className="absolute top-0 bottom-0 border-4 border-transparent bg-[var(--btn)] transition-all duration-200 ease-out shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.35)] rounded-[2px] pointer-events-none"
          style={{
            left: `${((currentStep - 1) / totalSteps) * 100}%`,
            width: `${100 / totalSteps}%`,
          }}
        />

        {/* 9 Steps Labels */}
        {STEP_NAMES.map((name, idx) => {
          const stepNumber = idx + 1;
          const isActive = stepNumber === currentStep;

          return (
            <div
              key={name}
              className={`relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 px-1 font-pixel text-[8px] sm:text-[9px] md:text-[10px] tracking-tight transition-colors duration-150 select-none ${
                isActive
                  ? 'text-[var(--btnink)] font-bold drop-shadow'
                  : 'text-[var(--dialink)] hover:text-[var(--ink)]'
              }`}
            >
              <span className={`text-[10px] sm:text-xs font-terminal ${isActive ? 'opacity-100 font-bold' : 'opacity-60'}`}>
                {stepNumber}
              </span>
              <span className="hidden md:inline whitespace-nowrap">
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Caption / Keyboard navigation helper */}
      <div className="flex items-center justify-between text-[11px] font-pixel text-[var(--mqc)] mt-2 px-1">
        <span>STEP {currentStep} OF {totalSteps} · {STEP_NAMES[currentStep - 1]}</span>
        <span className="hidden sm:inline opacity-70">USE ← / → ARROWS TO SCRUB</span>
      </div>
    </div>
  );
};
