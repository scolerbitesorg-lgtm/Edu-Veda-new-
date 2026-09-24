import React from 'react';
import { ArrowRight, ChevronRight, ExternalLink, Sparkles, FileText, PlayCircle } from 'lucide-react';
import type { CustomSection, CustomDynamicItem } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicCustomSectionProps {
  section: CustomSection;
  onSelectAction: (actionType: string, targetId?: string, url?: string) => void;
}

export const DynamicCustomSection: React.FC<DynamicCustomSectionProps> = ({
  section,
  onSelectAction,
}) => {
  const { playTap } = useAudio();

  if (section.visible === false) return null;

  const handleItemClick = (item: CustomDynamicItem) => {
    playTap();
    const url = item.url || item.link;
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    onSelectAction(item.actionType || 'link', item.targetId, url);
  };

  const handleSectionHeaderClick = () => {
    if (section.buttonUrl) {
      playTap();
      if (section.buttonUrl.startsWith('http')) {
        window.open(section.buttonUrl, '_blank', 'noopener,noreferrer');
      } else {
        onSelectAction('link', undefined, section.buttonUrl);
      }
    }
  };

  return (
    <div className="w-full space-y-3 pt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {section.title}
            </h3>
            {section.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {section.badge}
              </span>
            )}
          </div>
          {section.subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{section.subtitle}</p>
          )}
        </div>

        {section.buttonText && (
          <button
            type="button"
            onClick={handleSectionHeaderClick}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
          >
            <span>{section.buttonText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Render HTML Content if provided */}
      {section.htmlContent && (
        <div
          className="prose prose-sm max-w-none p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: section.htmlContent }}
        />
      )}

      {/* Render Items if provided */}
      {section.items && section.items.length > 0 && (
        <div
          className={
            section.type === 'list'
              ? 'space-y-2'
              : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
          }
        >
          {section.items.map(item => {
            const hasImage = Boolean(item.image);
            const isExternal = Boolean((item.url || item.link)?.startsWith('http'));

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-200 hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-start gap-3 select-none text-left"
              >
                {/* Thumbnail / Image */}
                {hasImage && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.badge}
                      </span>
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.title}
                    </h4>
                  </div>

                  {(item.subtitle || item.description) && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.subtitle || item.description}
                    </p>
                  )}

                  {/* Button or action indicator */}
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
                    <span>{item.buttonText || 'Open'}</span>
                    {isExternal ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
