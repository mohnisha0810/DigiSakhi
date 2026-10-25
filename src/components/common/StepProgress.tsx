import React from 'react';
import { Check } from 'lucide-react';

interface StepProgressProps {
  steps: { id: number | string; label: string }[];
  currentStep: number;
  accentColor?: 'teal' | 'violet' | 'coral';
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  accentColor = 'teal',
}) => {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[#E8E1F3] -z-0" />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-[#5517C8] to-[#365BFF] text-white border-transparent shadow-md ring-2 ring-[#5517C8]/20'
                    : isCompleted
                    ? 'bg-[#F2EDFF] text-[#5517C8] border-[#5517C8]/40'
                    : 'bg-white text-[#716B80] border-[#E8E1F3]'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stepNum}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-1 max-w-[70px] text-center truncate ${
                  isCurrent
                    ? 'text-[#5517C8] font-bold'
                    : isCompleted
                    ? 'text-[#211638]'
                    : 'text-[#716B80]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
