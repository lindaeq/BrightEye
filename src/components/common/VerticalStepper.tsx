import React from 'react';
import { useArcade, STEP_NAMES } from '../../context/ArcadeContext';
import { Check, X } from 'lucide-react';

interface VerticalStepperProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VerticalStepper: React.FC<VerticalStepperProps> = ({ isOpen, onClose }) => {
  const { currentStep, goToStep } = useArcade();

  if (!isOpen) return null;

  return (
    <aside className="w-56 sm:w-64 bg-[var(--body)] border-r-2 border-[var(--bezel)] flex flex-col justify-between p-3 select-none z-30 transition-all duration-200 shadow-xl overflow-y-auto">
      
      {/* Sidebar Header */}
      <div>
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-3">
          <span className="font-pixel text-[10px] tracking-wider text-[var(--ink)] font-bold">
            MISSION STEPS
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--fld)] text-[var(--dim)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            title="Hide Steps Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 9 Vertical Steps */}
        <div className="space-y-1.5">
          {STEP_NAMES.map((name, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <button
                key={name}
                onClick={() => goToStep(stepNum)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--btn)] text-[var(--btnink)] font-bold shadow-md scale-[1.02]'
                    : 'text-[var(--ink)] hover:bg-[var(--fld)] border border-transparent'
                }`}
              >
                {/* Step Circle / Number */}
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center font-pixel text-[9px] font-bold transition-colors ${
                    isActive
                      ? 'bg-[var(--good)] text-black'
                      : isCompleted
                      ? 'bg-[var(--line)] text-[var(--ink)]'
                      : 'border border-[var(--dim)] text-[var(--dim)]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : stepNum}
                </div>

                {/* Step Title in Arcade Font */}
                <div className="flex-1 min-w-0">
                  <div className={`font-pixel text-[9px] sm:text-[10px] leading-tight truncate ${isActive ? 'font-bold' : 'opacity-85'}`}>
                    {name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[var(--line)] text-xs text-[var(--dim)] font-terminal">
        Step {currentStep} of {STEP_NAMES.length} · QNX Neuro Lab
      </div>

    </aside>
  );
};
