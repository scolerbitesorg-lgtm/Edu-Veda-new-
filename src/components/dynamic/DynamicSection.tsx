import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

interface DynamicSectionProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
  className = '',
}) => {
  const { playTap } = useAudio();

  return (
    <section className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={() => {
              playTap();
              onAction();
            }}
            className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 active:scale-95 transition-transform px-1 py-1"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div>{children}</div>
    </section>
  );
};
