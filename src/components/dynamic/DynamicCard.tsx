import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface DynamicCardProps {
  title: string;
  subtitle?: string;
  tag?: string;
  badge?: string;
  icon?: React.ReactNode;
  thumbnail?: string;
  footerText?: string;
  footerBadge?: string;
  onClick?: () => void;
  accentColor?: string;
  className?: string;
}

export const DynamicCard: React.FC<DynamicCardProps> = ({
  title,
  subtitle,
  tag,
  badge,
  icon,
  thumbnail,
  footerText,
  footerBadge,
  onClick,
  accentColor,
  className = '',
}) => {
  const { playTap } = useAudio();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        playTap();
        onClick?.();
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playTap();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98] cursor-pointer ${className}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          {icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: accentColor ? `${accentColor}18` : '#e0e7ff',
                color: accentColor || '#4f46e5',
              }}
            >
              {icon}
            </div>
          )}

          {thumbnail && !icon && (
            <img
              src={thumbnail}
              alt=""
              className="w-10 h-10 rounded-xl object-cover border border-slate-100 flex-shrink-0"
              loading="lazy"
            />
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 uppercase">
                {badge}
              </span>
            )}
            {tag && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {tag}
              </span>
            )}
          </div>
        </div>

        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {title}
        </h4>

        {subtitle && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {(footerText || footerBadge) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>{footerText}</span>
          {footerBadge && (
            <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-0.5">
              {footerBadge}
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      )}
    </div>
  );
};
