import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'teal' | 'violet' | 'slate';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'teal',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'violet':
        return {
          iconBg: 'bg-[#EAF7FF] text-[#365BFF]',
          button: 'bg-gradient-to-r from-[#365BFF] to-[#08C9E8] hover:opacity-95 text-white shadow-md',
        };
      case 'slate':
        return {
          iconBg: 'bg-slate-100 text-[#716B80]',
          button: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm',
        };
      case 'teal':
      default:
        return {
          iconBg: 'bg-[#F2EDFF] text-[#5517C8]',
          button: 'bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white shadow-md',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`p-8 sm:p-12 text-center rounded-3xl border border-[#E8E1F3] bg-white shadow-card flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xs border border-[#E8E1F3] ${styles.iconBg}`}
      >
        <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
      </div>

      <h3 className="text-base sm:text-lg font-extrabold text-[#211638] tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#716B80] mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`mt-5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer ${styles.button}`}
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
