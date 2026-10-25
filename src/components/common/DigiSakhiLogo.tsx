import React from 'react';

interface DigiSakhiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
  textClassName?: string;
  useFullImage?: boolean;
}

export const DigiSakhiLogo: React.FC<DigiSakhiLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = '',
  textClassName = '',
  useFullImage = false,
}) => {
  // Dimension definitions
  const dimensions = {
    sm: { img: 'h-8 w-8', fullImg: 'h-9', title: 'text-base', sub: 'text-[9.5px]' },
    md: { img: 'h-10 w-10', fullImg: 'h-12', title: 'text-lg', sub: 'text-[11px]' },
    lg: { img: 'h-14 w-14', fullImg: 'h-16', title: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'h-24 w-24', fullImg: 'h-28 sm:h-32', title: 'text-3xl', sub: 'text-sm' },
  }[size];

  // If full image is requested (e.g. Welcome screen or standalone presentation)
  if (useFullImage) {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        <img
          src="/digisakhi-official-logo.png"
          alt="DigiSakhi — For Her. With Her. Always."
          className={`${dimensions.fullImg} object-contain drop-shadow-sm`}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official DigiSakhi Heart-DS Monogram Emblem */}
      <div
        className={`${dimensions.img} rounded-2xl bg-white border border-[#E8E1F3] shadow-card flex items-center justify-center p-1 shrink-0 overflow-hidden group hover:border-[#5517C8]/40 transition-colors`}
      >
        <img
          src="/digisakhi-official-logo.png"
          alt="DigiSakhi Emblem"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
        />
      </div>

      {/* Brand Typographic Wordmark & Official Tagline */}
      {showText && (
        <div className="leading-tight text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${dimensions.title} ${textClassName}`}>
              <span className="text-[#5517C8]">Digi</span>
              <span className="text-[#08C9E8]">Sakhi</span>
            </span>
            <span
              className="inline-block w-2 h-2 rounded-full bg-[#08C9E8] animate-pulse"
              title="Protection Shield Active"
            />
          </div>

          {subtitle !== undefined ? (
            subtitle && (
              <p className={`text-[#716B80] font-semibold tracking-wide ${dimensions.sub}`}>
                {subtitle}
              </p>
            )
          ) : (
            <p className={`text-[#716B80] font-bold tracking-wide ${dimensions.sub}`}>
              For Her. With Her. Always.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
