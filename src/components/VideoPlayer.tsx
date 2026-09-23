import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Smartphone,
  PictureInPicture2,
  ChevronDown,
  RotateCw as RotateIcon,
  X,
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
  viewMode?: 'standard' | 'half' | 'fullscreen';
  onChangeViewMode?: (mode: 'standard' | 'half' | 'fullscreen') => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
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
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Landscape & Fullscreen Helper with Orientation Lock
 */
export const requestLandscapeFullscreen = async (element: HTMLElement | null) => {
  if (!element) return;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen({ navigationUI: 'hide' });
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (e) {
    console.warn('Fullscreen fallback:', e);
  }

  if (screen.orientation && typeof screen.orientation.lock === 'function') {
    try {
      await screen.orientation.lock('landscape');
    } catch {}
  } else if ((screen as any).lockOrientation) {
    try {
      (screen as any).lockOrientation('landscape');
    } catch {}
  }
};

export const exitLandscapeFullscreen = async () => {
  try {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    }
  } catch (e) {
    console.warn('Exit fullscreen error:', e);
  }

  if (screen.orientation && typeof screen.orientation.unlock === 'function') {
    try {
      screen.orientation.unlock();
    } catch {}
  }
  if (screen.orientation && typeof screen.orientation.lock === 'function') {
    try {
      await screen.orientation.lock('portrait');
      setTimeout(() => {
        try {
          screen.orientation.unlock();
        } catch {}
      }, 400);
    } catch {}
  }
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  viewMode = 'standard',
  onChangeViewMode,
  onProgressUpdate,
  onEnded,
}) => {
  const ytId = extractYouTubeId(src);

  if (ytId) {
    return (
      <YouTubeVideoEmbed
        ytId={ytId}
        title={title}
        viewMode={viewMode}
        onChangeViewMode={onChangeViewMode}
        onProgressUpdate={onProgressUpdate}
        onEnded={onEnded}
      />
    );
  }

  return (
    <HTML5VideoPlayer
      src={src}
      title={title}
      viewMode={viewMode}
      onChangeViewMode={onChangeViewMode}
      onProgressUpdate={onProgressUpdate}
      onEnded={onEnded}
    />
  );
};

/**
 * High-performance YouTube Video Embed Player with Forced Game-Mode Landscape Fullscreen & Swipe-Down Exit
 */
interface YouTubeVideoEmbedProps {
  ytId: string;
  title: string;
  viewMode?: 'standard' | 'half' | 'fullscreen';
  onChangeViewMode?: (mode: 'standard' | 'half' | 'fullscreen') => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
}

const YouTubeVideoEmbed: React.FC<YouTubeVideoEmbedProps> = ({
  ytId,
  title,
  viewMode = 'standard',
  onChangeViewMode,
  onProgressUpdate,
  onEnded,
}) => {
  const [markedDone, setMarkedDone] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(viewMode === 'fullscreen');
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
  });
  const [forceGameModeLandscape, setForceGameModeLandscape] = useState<boolean>(true);

  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  // Monitor device portrait/landscape orientation in real-time
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    onProgressUpdate?.(15, 10);
    const timer = setTimeout(() => {
      onProgressUpdate?.(90, 60);
    }, 25000);
    return () => clearTimeout(timer);
  }, [ytId]);

  const handleExitFullscreen = useCallback(async () => {
    await exitLandscapeFullscreen();
    setIsFullscreen(false);
    setDragY(0);
    setIsDragging(false);
    onChangeViewMode?.('standard');
  }, [onChangeViewMode]);

  const handleEnterFullscreen = useCallback(async () => {
    if (containerRef.current) {
      await requestLandscapeFullscreen(containerRef.current);
    }
    setIsFullscreen(true);
    setDragY(0);
    onChangeViewMode?.('fullscreen');
  }, [onChangeViewMode]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && isFullscreen) {
        setIsFullscreen(false);
        onChangeViewMode?.('standard');
      } else if (isFs && !isFullscreen) {
        setIsFullscreen(true);
        onChangeViewMode?.('fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, [isFullscreen, onChangeViewMode]);

  // Swipe Down to Dismiss Handlers (supports both physical and 90deg rotated gestures)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isFullscreen) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isFullscreen) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - touchStartY.current;
    const deltaX = currentX - touchStartX.current;

    const shouldRotate = isFullscreen && isPortrait && forceGameModeLandscape;

    if (shouldRotate) {
      // In 90deg rotated frame, horizontal swipe or vertical swipe dismisses
      const effectiveDelta = Math.max(deltaX, deltaY);
      if (effectiveDelta > 15) {
        setIsDragging(true);
        setDragY(Math.max(0, effectiveDelta));
      }
    } else {
      // Standard vertical swipe down
      if (deltaY > 15 && deltaY > Math.abs(deltaX)) {
        setIsDragging(true);
        setDragY(Math.max(0, deltaY));
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isFullscreen || !isDragging) return;
    if (dragY > 70) {
      handleExitFullscreen();
    } else {
      setDragY(0);
      setIsDragging(false);
    }
  };

  const handleMarkComplete = () => {
    setMarkedDone(true);
    onProgressUpdate?.(100, 100);
    onEnded?.();
  };

  const shouldRotate = isFullscreen && isPortrait && forceGameModeLandscape;

  // Calculate dynamic transform & layout styles
  let containerStyle: React.CSSProperties = {};
  if (isFullscreen) {
    if (shouldRotate) {
      // Game Mode Landscape Rotation (forces full horizontal landscape on portrait screen)
      containerStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: `translate(-50%, -50%) rotate(90deg) translateY(${dragY}px) scale(${
          1 - Math.min(0.2, dragY / 800)
        })`,
        transformOrigin: 'center center',
        zIndex: 999999,
        opacity: Math.max(0.4, 1 - dragY / 400),
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        touchAction: 'none',
      };
    } else {
      // Standard Fullscreen (Physical landscape or desktop)
      containerStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        transform: `translateY(${dragY}px) scale(${1 - Math.min(0.2, dragY / 800)})`,
        zIndex: 999999,
        opacity: Math.max(0.4, 1 - dragY / 400),
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
      };
    }
  }

  const containerClasses = isFullscreen
    ? 'bg-black flex flex-col justify-between overflow-hidden select-none'
    : viewMode === 'half'
    ? 'relative w-full h-full aspect-video sm:h-[48vh] bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800'
    : 'relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between group';

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={containerClasses}
      style={containerStyle}
    >
      {/* Top Header Controls Bar in Fullscreen Mode */}
      {isFullscreen && (
        <div className="absolute top-2 left-0 right-0 z-30 flex items-center justify-between px-4 pointer-events-auto">
          {/* Swipe Down to Exit button / indicator */}
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg"
          >
            <ChevronDown className="w-4 h-4" />
            <span>Swipe Down to Exit</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Rotation toggle button (Switch between 90deg Landscape Game Mode and Standard) */}
            {isPortrait && (
              <button
                type="button"
                onClick={() => setForceGameModeLandscape(prev => !prev)}
                className="px-2.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-indigo-300 text-xs font-bold flex items-center gap-1 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg"
                title="Toggle Landscape Rotation"
              >
                <RotateIcon className="w-3.5 h-3.5" />
                <span>{forceGameModeLandscape ? '90° Landscape' : 'Portrait'}</span>
              </button>
            )}

            {/* Exit Close Button */}
            <button
              type="button"
              onClick={handleExitFullscreen}
              className="w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg"
              aria-label="Exit Fullscreen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* YouTube Iframe Embed */}
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1&fs=1`}
        title={title || 'YouTube Video Lecture'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="w-full h-full object-cover border-0"
      />

      {/* Floating Action Controls Bar on Overlay (when not in fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleEnterFullscreen}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-slate-900/90 hover:bg-slate-900 text-indigo-300 border border-indigo-500/30 shadow-lg backdrop-blur-md active:scale-95 transition-all"
            title="Play in Landscape Game Mode"
          >
            <Smartphone className="w-3.5 h-3.5 rotate-90" />
            <span>Full Landscape</span>
          </button>

          <button
            type="button"
            onClick={handleMarkComplete}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              markedDone
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-slate-900/90 hover:bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-black/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{markedDone ? 'Completed' : 'Mark Done'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * HTML5 MP4 / Direct Stream Video Player with Forced Game-Mode Landscape Fullscreen & Swipe-Down Exit
 */
interface HTML5VideoPlayerProps {
  src: string;
  title: string;
  viewMode?: 'standard' | 'half' | 'fullscreen';
  onChangeViewMode?: (mode: 'standard' | 'half' | 'fullscreen') => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
}

const HTML5VideoPlayer: React.FC<HTML5VideoPlayerProps> = ({
  src,
  title,
  viewMode = 'standard',
  onChangeViewMode,
  onProgressUpdate,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(viewMode === 'fullscreen');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [lastTap, setLastTap] = useState<number>(0);

  // Orientation & Game Mode Landscape Rotation
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
  });
  const [forceGameModeLandscape, setForceGameModeLandscape] = useState<boolean>(true);

  // Swipe-down to exit gesture state
  const [dragY, setDragY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  // Monitor device orientation in real-time
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + seconds)
    );
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const handleSetSpeed = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Picture in Picture
  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  // Landscape Fullscreen Trigger
  const handleEnterFullscreen = useCallback(async () => {
    if (containerRef.current) {
      await requestLandscapeFullscreen(containerRef.current);
    }
    setIsFullscreen(true);
    setDragY(0);
    onChangeViewMode?.('fullscreen');
  }, [onChangeViewMode]);

  // Exit Fullscreen & Restore Portrait
  const handleExitFullscreen = useCallback(async () => {
    await exitLandscapeFullscreen();
    setIsFullscreen(false);
    setDragY(0);
    setIsDragging(false);
    onChangeViewMode?.('standard');
  }, [onChangeViewMode]);

  const handleToggleLandscape = () => {
    if (!isFullscreen) {
      handleEnterFullscreen();
    } else {
      handleExitFullscreen();
    }
  };

  // Touch handlers for Double Tap to skip + Swipe Down to dismiss
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    resetControlsTimer();
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(false);

    // Double tap skip detection
    const now = Date.now();
    if (now - lastTap < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touchX = e.touches[0]?.clientX || 0;
      const isRightSide = touchX - rect.left > rect.width / 2;
      handleSkip(isRightSide ? 10 : -10);
    }
    setLastTap(now);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isFullscreen) return;
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - touchStartY.current;
    const deltaX = currentX - touchStartX.current;

    const shouldRotate = isFullscreen && isPortrait && forceGameModeLandscape;

    if (shouldRotate) {
      const effectiveDelta = Math.max(deltaX, deltaY);
      if (effectiveDelta > 15) {
        setIsDragging(true);
        setDragY(Math.max(0, effectiveDelta));
      }
    } else {
      if (deltaY > 15 && deltaY > Math.abs(deltaX)) {
        setIsDragging(true);
        setDragY(Math.max(0, deltaY));
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isFullscreen || !isDragging) return;
    if (dragY > 70) {
      handleExitFullscreen();
    } else {
      setDragY(0);
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && isFullscreen) {
        setIsFullscreen(false);
        onChangeViewMode?.('standard');
      } else if (isFs && !isFullscreen) {
        setIsFullscreen(true);
        onChangeViewMode?.('fullscreen');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen, onChangeViewMode]);

  const shouldRotate = isFullscreen && isPortrait && forceGameModeLandscape;

  let containerStyle: React.CSSProperties = {};
  if (isFullscreen) {
    if (shouldRotate) {
      containerStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: '100vh',
        height: '100vw',
        transform: `translate(-50%, -50%) rotate(90deg) translateY(${dragY}px) scale(${
          1 - Math.min(0.2, dragY / 800)
        })`,
        transformOrigin: 'center center',
        zIndex: 999999,
        opacity: Math.max(0.4, 1 - dragY / 400),
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        touchAction: 'none',
      };
    } else {
      containerStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        transform: `translateY(${dragY}px) scale(${1 - Math.min(0.2, dragY / 800)})`,
        zIndex: 999999,
        opacity: Math.max(0.4, 1 - dragY / 400),
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
      };
    }
  }

  const containerClasses = isFullscreen
    ? 'bg-black flex flex-col justify-between overflow-hidden select-none'
    : viewMode === 'half'
    ? 'relative w-full h-[45vh] max-h-[480px] bg-black rounded-2xl overflow-hidden shadow-2xl select-none group'
    : 'relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg select-none group';

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={containerClasses}
      style={containerStyle}
    >
      {/* Top Pull-to-Dismiss Handle Banner in Fullscreen */}
      {isFullscreen && (
        <div
          className={`absolute top-2 left-0 right-0 z-30 flex items-center justify-between px-4 transition-opacity duration-300 pointer-events-auto ${
            showControls || dragY > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg"
          >
            <ChevronDown className="w-4 h-4" />
            <span>Swipe Down to Exit</span>
          </button>

          <div className="flex items-center gap-2">
            {isPortrait && (
              <button
                type="button"
                onClick={() => setForceGameModeLandscape(prev => !prev)}
                className="px-2.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-indigo-300 text-xs font-bold flex items-center gap-1 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg"
                title="Toggle Landscape Rotation"
              >
                <RotateIcon className="w-3.5 h-3.5" />
                <span>{forceGameModeLandscape ? '90° Landscape' : 'Portrait'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExitFullscreen}
              className="w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg"
              aria-label="Exit Fullscreen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
          }
          setIsLoading(false);
        }}
        onTimeUpdate={() => {
          if (videoRef.current) {
            const current = videoRef.current.currentTime;
            setCurrentTime(current);
            const total = videoRef.current.duration || 1;
            const percent = Math.min(100, Math.round((current / total) * 100));
            onProgressUpdate?.(percent, current);
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          resetControlsTimer();
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white pointer-events-none">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mb-2" />
          <span className="text-xs font-medium tracking-wide">Buffering Video...</span>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center text-white">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <h4 className="text-sm font-semibold">Video Stream Unavailable</h4>
          <p className="text-xs text-slate-300 max-w-xs mt-1">
            Unable to stream this video file. Please verify video link or network.
          </p>
        </div>
      )}

      {/* Top Header Overlay with Title & Landscape Button (When not in fullscreen) */}
      {!isFullscreen && (
        <div
          className={`absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 flex items-center justify-between text-white z-10 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="text-xs font-semibold truncate pr-4">{title}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleLandscape}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Play in Landscape Game Mode"
            >
              <Smartphone className="w-3.5 h-3.5 rotate-90" />
              <span>Full Landscape</span>
            </button>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/80 font-medium">
              HD
            </span>
          </div>
        </div>
      )}

      {/* Big Center Play/Pause Indicator */}
      {!isLoading && !hasError && !isPlaying && (
        <button
          type="button"
          onClick={handlePlayPause}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 z-10"
          aria-label="Play Video"
        >
          <Play className="w-7 h-7 fill-white ml-1" />
        </button>
      )}

      {/* Custom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-6 pb-2.5 px-3 transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Slider */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] text-slate-300 font-mono">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            aria-label="Video seek bar"
          />
          <span className="text-[11px] text-slate-400 font-mono">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-1.5 rounded-lg hover:bg-white/10 active:scale-90 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            {/* Skip -10s */}
            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white active:scale-90 transition-all"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip +10s */}
            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white active:scale-90 transition-all"
              aria-label="Fast forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1 group/vol">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white active:scale-90 transition-all"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-indigo-500 hidden sm:block"
                aria-label="Volume slider"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Picture in Picture */}
            {document.pictureInPictureEnabled && (
              <button
                type="button"
                onClick={handleTogglePiP}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white active:scale-90 transition-all"
                title="Picture-in-Picture"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>
            )}

            {/* Playback Speed */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold tracking-tight transition-all flex items-center gap-1"
                aria-label="Playback Speed"
              >
                <Settings className="w-3 h-3" />
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-slate-900 border border-slate-700 rounded-xl py-1 w-24 shadow-2xl z-30">
                  {speedOptions.map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSetSpeed(speed)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                        playbackRate === speed
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{speed}x</span>
                      {playbackRate === speed && <span>&bull;</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Landscape Fullscreen */}
            <button
              type="button"
              onClick={handleToggleLandscape}
              className="p-1.5 rounded-lg hover:bg-white/10 text-indigo-300 hover:text-white active:scale-90 transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
