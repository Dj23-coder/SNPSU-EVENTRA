import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showUniversitySlot?: boolean;
}

/**
 * SNPSU EVENTRA Official Brand Logo
 * Clean, solid calendar icon with a warm gold spark and refined wordmark.
 * Uses Source Serif 4 for institutional authority.
 */
export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showUniversitySlot = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* ======================================================== */}
      {/* [SLOT: OFFICIAL SAPTHAGIRI NPS UNIVERSITY CREST / LOGO] */}
      {/* Reserved for official university administration emblem  */}
      {/* ======================================================== */}
      {showUniversitySlot && (
        <div
          title="Slot for official university crest (to be provided by university administration)"
          className="hidden xl:flex items-center justify-center w-8 h-8 rounded-md border border-slate-300 bg-slate-100 text-[10px] font-bold text-slate-700 px-1 text-center leading-tight shrink-0 select-none"
        >
          SNPSU
        </div>
      )}

      {/* Solid Deep Navy Calendar + Warm Gold Spark Icon */}
      <div
        className={`${iconSizes[size]} rounded-lg bg-[#0F1B2D] text-white flex items-center justify-center shadow-xs relative shrink-0 border border-[#1A2B44]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/8 h-5/8 text-white"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />

          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>

        {/* Warm Gold Spark / Star */}
        <span
          className="absolute -top-1 -right-1 text-[#C59A3F]"
          title="Campus Star"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </span>
      </div>

      {/* Wordmark */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-heading font-bold tracking-tight text-[#0F172A] ${titleSizes[size]}`}
            >
              SNPSU <span className="text-[#C59A3F]">EVENTRA</span>
            </span>
          </div>
          <p
            className={`font-sans font-semibold tracking-wide text-slate-500 uppercase mt-0.5 ${subtitleSizes[size]}`}
          >
            SAPTHAGIRI NPS UNIVERSITY CAMPUS HUB
          </p>
        </div>
      )}
    </div>
  );
};
