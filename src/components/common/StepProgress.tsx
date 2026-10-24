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
  const getActiveClass = () => {
    switch (accentColor) {
      case 'violet':
        return 'bg-brand-violet text-white border-brand-violet shadow-violet';
      case 'coral':
        return 'bg-brand-coral text-white border-brand-coral shadow-coral';
      case 'teal':
      default:
        return 'bg-brand-teal text-white border-brand-teal shadow-teal';
    }
  };

  const getCompletedClass = () => {
    switch (accentColor) {
      case 'violet':
        return 'bg-brand-lavender text-brand-violet border-brand-violet/30';
      case 'coral':
        return 'bg-brand-peach text-brand-coral border-brand-coral/30';
      case 'teal':
      default:
        return 'bg-brand-aqua text-brand-teal border-brand-teal/30';
    }
  };

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-brand-border -z-0" />

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  isCurrent
                    ? getActiveClass()
                    : isCompleted
                    ? getCompletedClass()
                    : 'bg-white text-brand-muted border-brand-border'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stepNum}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-1 max-w-[70px] text-center truncate ${
                  isCurrent
                    ? 'text-brand-text font-bold'
                    : isCompleted
                    ? 'text-brand-muted'
                    : 'text-brand-muted/70'
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
