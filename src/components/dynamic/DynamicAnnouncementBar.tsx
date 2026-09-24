import React, { useState } from 'react';
import { Bell, ChevronRight, X, Sparkles, ExternalLink } from 'lucide-react';
import type { Announcement } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicAnnouncementBarProps {
  announcements: Announcement[];
  onAction?: (announcement: Announcement) => void;
}

export const DynamicAnnouncementBar: React.FC<DynamicAnnouncementBarProps> = ({
  announcements,
  onAction,
}) => {
  const { playTap } = useAudio();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeList = announcements.filter(
    a => a.published !== false && !dismissedIds.has(a.id) && (a.title || a.message)
  );

  if (activeList.length === 0) return null;

  const current = activeList[0];

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => new Set([...prev, current.id]));
  };

  const handleClick = () => {
    playTap();
    if (current.link) {
      if (current.link.startsWith('http')) {
        window.open(current.link, '_blank', 'noopener,noreferrer');
      } else {
        onAction?.(current);
      }
    } else {
      onAction?.(current);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      className="w-full bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-3 shadow-2xs text-left cursor-pointer active:scale-[0.99] transition-all flex items-start gap-2.5 relative group overflow-hidden"
    >
      {/* Decorative accent bar on left */}
      <div className="w-1.5 self-stretch rounded-full bg-amber-500 shrink-0" />

      {/* Bell / Alert Icon */}
      <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
        <Bell className="w-4 h-4 animate-bounce" />
      </div>

      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-200/80 text-amber-900 tracking-wider">
            {current.badge || 'Alert'}
          </span>
          <h4 className="text-xs font-bold text-slate-900 truncate">
            {current.title}
          </h4>
        </div>

        <p className="text-xs text-slate-700 leading-snug line-clamp-2 mt-0.5">
          {current.message}
        </p>

        {current.link && (
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 mt-1">
            <span>View Details</span>
            {current.link.startsWith('http') ? (
              <ExternalLink className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </div>
        )}
      </div>

      {/* Close / Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss alert"
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
