import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showUniversitySlot?: boolean;
}

/**
 * SNPSU EVENTRA Official Brand Logo
 * Features a calendar icon with a small golden spark/star and clean wordmark.
 * Easily swappable in this single file.
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
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* ======================================================== */}
      {/* [SLOT: OFFICIAL SAPTHAGIRI NPS UNIVERSITY CREST / LOGO] */}
      {/* Future integration: Replace this placeholder or inject  */}
      {/* <img src="/official-snpsu-crest.png" alt="SNPSU" /> here.   */}
      {/* ======================================================== */}
      {showUniversitySlot && (
        <div
          title="Slot for official university crest (to be provided by university administration)"
          className="hidden xl:flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-emerald-400/40 bg-emerald-950/20 text-[9px] font-bold text-emerald-400 px-1 text-center leading-tight shrink-0 select-none"
        >
          SNPSU
        </div>
      )}

      {/* Primary EVENTRA Calendar + Spark Icon */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md relative shrink-0 ring-1 ring-white/20`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5/8 h-5/8 text-white drop-shadow-xs"
        >
          {/* Calendar Body */}
          <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />

          {/* Calendar Day Grid Points */}
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="18" r="1" fill="currentColor" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>

        {/* Small golden event spark/star at top-right corner */}
        <span
          className="absolute -top-1 -right-1 text-amber-300 drop-shadow-md animate-pulse"
          title="Campus Life Spark"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </span>
      </div>

      {/* Wordmark (hidden if icon-only) */}
      {variant !== 'icon-only' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition ${titleSizes[size]}`}
            >
              SNPSU <span className="text-emerald-600">EVENTRA</span>
            </span>
          </div>
          <span
            className={`font-semibold tracking-wider text-slate-500 uppercase mt-0.5 ${subtitleSizes[size]}`}
          >
            Sapthagiri NPS University Campus Hub
          </span>
        </div>
      )}
    </div>
  );
};
