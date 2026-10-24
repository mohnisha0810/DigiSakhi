import React from 'react';

interface DigiSakhiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
}

export const DigiSakhiLogo: React.FC<DigiSakhiLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
  textClassName = '',
}) => {
  const iconDimensions = {
    sm: { container: 'w-8 h-8 rounded-xl', icon: 'w-4 h-4', title: 'text-base', sub: 'text-[9px]' },
    md: { container: 'w-10 h-10 rounded-2xl', icon: 'w-5 h-5', title: 'text-lg', sub: 'text-[10px]' },
    lg: { container: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6', title: 'text-xl', sub: 'text-xs' },
    xl: { container: 'w-14 h-14 rounded-3xl', icon: 'w-7 h-7', title: 'text-2xl', sub: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* DigiSakhi Brand Emblem */}
      <div
        className={`${iconDimensions.container} bg-gradient-to-tr from-brand-teal via-brand-deepTeal to-brand-violet flex items-center justify-center text-white shadow-teal shrink-0 relative overflow-hidden group`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconDimensions.icon} text-white transition-transform group-hover:scale-105`}
        >
          {/* Protective Shield Outer */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          {/* Inner Empowering Heart & Companion Symbol */}
          <path
            d="M12 8.2c-.8-1.2-2.1-1.7-3.2-1.2-1.4.6-1.8 2.2-.9 3.4 1 1.3 3.1 3.4 4.1 4.1 1-.7 3.1-2.8 4.1-4.1.9-1.2.5-2.8-.9-3.4-1.1-.5-2.4 0-3.2 1.2z"
            fill="currentColor"
            stroke="none"
            opacity="0.9"
          />
        </svg>

        {/* Ambient Glow Accent */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-aqua/80 animate-pulse" />
      </div>

      {/* Brand Typographic Wordmark */}
      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-brand-text ${iconDimensions.title} ${textClassName}`}>
              <span className="text-brand-text">Digi</span>
              <span className="text-brand-teal">Sakhi</span>
            </span>
            <span
              className="inline-block w-2 h-2 rounded-full bg-brand-teal animate-pulse"
              title="Protection Active"
            />
          </div>
          {subtitle !== undefined ? (
            subtitle && (
              <p className={`text-brand-muted font-semibold tracking-wide ${iconDimensions.sub}`}>
                {subtitle}
              </p>
            )
          ) : (
            <p className={`text-brand-muted font-semibold tracking-wide ${iconDimensions.sub}`}>
              Women's Safety & Empowerment
            </p>
          )}
        </div>
      )}
    </div>
  );
};
