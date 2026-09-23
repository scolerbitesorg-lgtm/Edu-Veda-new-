import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicBannerProps {
  banners: Banner[];
  onAction?: (banner: Banner) => void;
}

export const DynamicBanner: React.FC<DynamicBannerProps> = ({ banners, onAction }) => {
  const { playTap } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.filter(b => b.published !== false && b.title);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex] || activeBanners[0];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-sm border border-slate-200/80 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white select-none">
      {/* Background Graphic or Image */}
      {current.image ? (
        <div className="absolute inset-0 z-0 opacity-25">
          <img
            src={current.image}
            alt={current.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-600/30 blur-2xl pointer-events-none" />
      )}

      <div className="relative z-10 p-4.5 sm:p-6 flex flex-col justify-between min-h-[140px]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold tracking-wide text-amber-300 uppercase mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Featured</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-2 drop-shadow-sm">
            {current.title}
          </h3>

          {current.subtitle && (
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 line-clamp-2 max-w-[85%] font-medium">
              {current.subtitle}
            </p>
          )}
        </div>

        <div className="mt-3.5 flex items-center justify-between">
          {current.buttonVisible !== false && (
            <button
              type="button"
              onClick={() => {
                playTap();
                onAction?.(current);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-950 text-xs sm:text-sm font-bold shadow-md hover:bg-indigo-50 active:scale-95 transition-all"
            >
              <span>{current.buttonText || 'Explore Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dots pagination */}
          {activeBanners.length > 1 && (
            <div className="flex items-center gap-1.5 ml-auto">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
