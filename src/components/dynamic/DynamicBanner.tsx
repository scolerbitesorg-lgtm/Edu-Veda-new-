import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import type { Banner } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicBannerProps {
  banners: Banner[];
  onAction?: (banner: Banner) => void;
}

export const DynamicBanner: React.FC<DynamicBannerProps> = ({ banners, onAction }) => {
  const { playTap } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Filter valid published banners
  const activeBanners = banners.filter(
    b => b.published !== false && (b.title || b.image || b.subtitle)
  );

  // Auto-scroll through active banners every 5 seconds if not paused
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex] || activeBanners[0];

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playTap();
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playTap();
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleBannerClick = () => {
    playTap();
    onAction?.(current);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const isFullImageBanner = Boolean(current.image && !current.title && !current.subtitle);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleBannerClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full overflow-hidden rounded-3xl shadow-sm border border-slate-200/80 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white select-none cursor-pointer group active:scale-[0.99] transition-all"
    >
      {/* Background Graphic or Admin Uploaded Poster Image */}
      {current.image ? (
        <div className={`absolute inset-0 z-0 ${isFullImageBanner ? 'opacity-100' : 'opacity-30 group-hover:opacity-40'} transition-opacity`}>
          <img
            src={current.image}
            alt={current.title || 'Edu Veda Banner'}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              // Hide broken images gracefully
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          {!isFullImageBanner && (
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-950/40 to-transparent" />
          )}
        </div>
      ) : (
        <>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500/25 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-purple-500/20 blur-xl pointer-events-none" />
        </>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 p-4.5 sm:p-6 flex flex-col justify-between min-h-[145px]">
        <div>
          {/* Tag or Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide text-amber-300 uppercase shadow-2xs">
              <Sparkles className="w-3 h-3" />
              <span>{current.badge || current.tag || 'Featured'}</span>
            </div>

            {/* Quick External Link indicator if external URL */}
            {current.buttonUrl?.startsWith('http') && (
              <span className="text-white/60 hover:text-white transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          {/* Title */}
          {current.title && (
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white line-clamp-2 drop-shadow-sm leading-snug">
              {current.title}
            </h3>
          )}

          {/* Subtitle / Description */}
          {current.subtitle && (
            <p className="text-xs text-indigo-100/90 mt-1 line-clamp-2 max-w-[90%] font-medium leading-relaxed">
              {current.subtitle}
            </p>
          )}
        </div>

        {/* Bottom CTA Row & Carousel Navigation */}
        <div className="mt-3.5 flex items-center justify-between gap-2">
          {current.buttonVisible !== false && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-indigo-950 text-xs font-bold shadow-sm group-hover:bg-amber-300 transition-colors">
              <span>{current.buttonText || 'Explore Now'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Multi-banner navigation & Dots pagination */}
          {activeBanners.length > 1 && (
            <div className="flex items-center gap-1.5 ml-auto bg-black/20 backdrop-blur-md px-2 py-1 rounded-full">
              <button
                type="button"
                aria-label="Previous banner"
                onClick={handlePrev}
                className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={e => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label="Next banner"
                onClick={handleNext}
                className="w-5 h-5 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
