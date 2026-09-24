import React from 'react';
import {
  Award,
  FileText,
  CheckSquare,
  Sparkles,
  BookOpen,
  PlayCircle,
  HelpCircle,
  Compass,
  Send,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { QuickLink } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicQuickLinksProps {
  links: QuickLink[];
  onSelectAction: (actionType: string, targetId?: string, url?: string) => void;
}

// Maps icon string names to Lucide icons safely
function renderIcon(iconName?: string) {
  const norm = (iconName || '').toLowerCase();
  if (norm.includes('test') || norm.includes('award') || norm.includes('quiz')) {
    return <Award className="w-5 h-5" />;
  }
  if (norm.includes('note') || norm.includes('file') || norm.includes('pdf')) {
    return <FileText className="w-5 h-5" />;
  }
  if (norm.includes('pyq') || norm.includes('check') || norm.includes('paper')) {
    return <CheckSquare className="w-5 h-5" />;
  }
  if (norm.includes('ai') || norm.includes('sparkle') || norm.includes('bot') || norm.includes('veda')) {
    return <Sparkles className="w-5 h-5" />;
  }
  if (norm.includes('video') || norm.includes('lecture') || norm.includes('play')) {
    return <PlayCircle className="w-5 h-5" />;
  }
  if (norm.includes('telegram') || norm.includes('send') || norm.includes('chat')) {
    return <Send className="w-5 h-5" />;
  }
  if (norm.includes('category') || norm.includes('compass') || norm.includes('explore')) {
    return <Compass className="w-5 h-5" />;
  }
  return <BookOpen className="w-5 h-5" />;
}

export const DynamicQuickLinks: React.FC<DynamicQuickLinksProps> = ({
  links,
  onSelectAction,
}) => {
  const { playTap } = useAudio();

  const activeLinks = links.filter(l => l.published !== false && l.title);
  if (activeLinks.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {activeLinks.map(link => {
          const isExternal = Boolean(link.url && link.url.startsWith('http'));

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                playTap();
                if (isExternal && link.url) {
                  window.open(link.url, '_blank', 'noopener,noreferrer');
                } else {
                  onSelectAction(link.actionType || 'link', link.targetId, link.url);
                }
              }}
              className="flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-indigo-200 hover:shadow-xs active:scale-95 transition-all text-center relative group select-none min-h-[82px]"
            >
              {/* Badge if present */}
              {link.badge && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-rose-500 text-white shadow-2xs">
                  {link.badge}
                </span>
              )}

              {/* Icon bubble */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 shadow-2xs"
                style={{
                  backgroundColor: link.bgColor || '#eef2ff',
                  color: link.color || '#4f46e5',
                }}
              >
                {link.image ? (
                  <img
                    src={link.image}
                    alt={link.title}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  renderIcon(link.icon || link.title)
                )}
              </div>

              {/* Title & optional subtitle */}
              <div className="w-full mt-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {link.title}
                </span>
                {link.subtitle && (
                  <span className="text-[9px] text-slate-400 line-clamp-1 block">
                    {link.subtitle}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
