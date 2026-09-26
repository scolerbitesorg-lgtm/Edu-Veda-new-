import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize, ChevronLeft, ShieldCheck } from 'lucide-react';

export interface VideoPlayerProps {
  src: string;
  title: string;
  viewMode?: 'standard' | 'half' | 'fullscreen';
  onChangeViewMode?: (mode: 'standard' | 'half' | 'fullscreen') => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
  onBack?: () => void;
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
  );
  if (match) return match[1];

  try {
    const parsed = new URL(trimmed);
    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }
  } catch {}

  return null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  onBack,
}) => {
  const ytId = extractYouTubeId(src);

  if (ytId) {
    return <YouTubeEmbedPlayer key={ytId} videoId={ytId} title={title} onBack={onBack} />;
  }

  return <HTML5Player key={src} src={src} title={title} onBack={onBack} />;
};

/**
 * Clean YouTube Embed Player
 * - Uses exact embed URL format requested:
 *   https://www.youtube.com/embed/{VIDEO_ID}?controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1
 * - Zero blocking overlays: Touch & click events directly reach the YouTube iframe.
 * - allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 * - allowFullScreen enabled.
 */
interface YouTubeEmbedPlayerProps {
  videoId: string;
  title: string;
  onBack?: () => void;
}

const YouTubeEmbedPlayer: React.FC<YouTubeEmbedPlayerProps> = ({
  videoId,
  title,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`;

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen flex flex-col justify-center items-center'
          : 'aspect-video rounded-2xl border border-slate-800'
      }`}
    >
      {/* Top Header Bar for Clean Navigation & Fullscreen */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent px-3 py-2.5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 max-w-[70%]">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 sm:p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow-md">
            {title || 'Edu Veda Classroom Lecture'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Private Stream</span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 
        Direct Clickable Video Container
        - NO transparent overlay blocking touch/clicks
        - pointer-events: auto so native play button is immediately responsive
      */}
      <div className="w-full h-full relative pointer-events-auto flex items-center justify-center bg-black">
        <iframe
          src={embedUrl}
          title={title || 'Edu Veda Lecture'}
          className="w-full h-full border-0 pointer-events-auto"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

/**
 * Standard HTML5 Video Player Fallback
 */
interface HTML5PlayerProps {
  src: string;
  title: string;
  onBack?: () => void;
}

const HTML5Player: React.FC<HTML5PlayerProps> = ({
  src,
  title,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen flex flex-col justify-center items-center'
          : 'aspect-video rounded-2xl border border-slate-800'
      }`}
    >
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/40 to-transparent px-3 py-2.5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 max-w-[70%]">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 sm:p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow-md">
            {title || 'Edu Veda Classroom Lecture'}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain pointer-events-auto"
      />
    </div>
  );
};
