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
  Loader2,
  ChevronLeft,
  FastForward,
  Rewind,
  X,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title: string;
  viewMode?: 'standard' | 'half' | 'fullscreen';
  onChangeViewMode?: (mode: 'standard' | 'half' | 'fullscreen') => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
  onBack?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
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
 * Screen orientation helpers for mobile landscape
 */
export const lockLandscapeOrientation = async () => {
  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape').catch(() => {});
    } else if (typeof (window.screen as any).lockOrientation === 'function') {
      (window.screen as any).lockOrientation('landscape');
    }
  } catch (e) {
    console.warn('Orientation lock notice:', e);
  }
};

export const unlockOrientation = () => {
  try {
    const orientation = window.screen?.orientation as any;
    if (orientation && typeof orientation.unlock === 'function') {
      orientation.unlock();
    } else if (typeof (window.screen as any).unlockOrientation === 'function') {
      (window.screen as any).unlockOrientation();
    }
  } catch (e) {
    console.warn('Orientation unlock notice:', e);
  }
};

/**
 * Format seconds into MM:SS
 */
function formatTime(timeInSeconds: number): string {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => {
  const ytId = extractYouTubeId(props.src);

  if (ytId) {
    return <PrivateStreamPlayer key={ytId} ytId={ytId} {...props} />;
  }

  return <HTML5VideoPlayer key={props.src} {...props} />;
};

/**
 * 🔒 Private Stream Video Player (Zero YouTube Branding + Portrait Side-View Fullscreen)
 * 1. Zero YouTube Logo / Watermarks:
 *    - Uses custom cover poster before start so YouTube's red center button is never seen.
 *    - Scale 1.08 + overflow: hidden strictly crops out YouTube logo, watermark, and header cards.
 * 2. Portrait Side View Fullscreen:
 *    - In portrait mode, users can click Fullscreen / Side View to rotate 90 degrees seamlessly into full cinema landscape.
 */
interface PrivateStreamProps extends VideoPlayerProps {
  ytId: string;
}

const PrivateStreamPlayer: React.FC<PrivateStreamProps> = ({
  ytId,
  title,
  onProgressUpdate,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerContainerId = useRef<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);
  const ytPlayerRef = useRef<any>(null);

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSideViewRotated, setIsSideViewRotated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Gesture Feedback
  const [rippleSide, setRippleSide] = useState<'left' | 'right' | null>(null);
  const [rippleText, setRippleText] = useState<string>('');
  const rippleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Auto-hide custom controls after 3 seconds of playback
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Load YouTube IFrame API SDK
  useEffect(() => {
    let isCancelled = false;

    const initPlayer = () => {
      if (isCancelled || !window.YT || !window.YT.Player) return;

      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
          ytPlayerRef.current.destroy();
        }

        ytPlayerRef.current = new window.YT.Player(playerContainerId.current, {
          videoId: ytId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              setIsPlayerReady(true);
              setIsLoading(false);
              try {
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(dur);
              } catch {}
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
              if (event.data === 1) {
                setIsPlaying(true);
                setHasStarted(true);
                setIsLoading(false);
                const dur = event.target.getDuration();
                if (dur && dur > 0) setDuration(dur);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                onProgressUpdateRef.current?.(100, duration);
                onEndedRef.current?.();
              } else if (event.data === 3) {
                setIsLoading(true);
              }
            },
            onError: () => {
              if (isCancelled) return;
              setIsLoading(false);
            },
          },
        });
      } catch (err) {
        console.error('Error initializing private player:', err);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      isCancelled = true;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
    };
  }, [ytId]);

  // Sync playback time every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      if (ytPlayerRef.current && isPlaying) {
        try {
          const curr = ytPlayerRef.current.getCurrentTime();
          if (typeof curr === 'number' && !isNaN(curr)) {
            setCurrentTime(curr);
            const total = duration || ytPlayerRef.current.getDuration() || 300;
            if (total > 0) {
              setDuration(total);
              const percent = Math.min(100, Math.round((curr / total) * 100));
              onProgressUpdateRef.current?.(percent, curr);
            }
          }
        } catch {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFs = Boolean(document.fullscreenElement);
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
        setIsSideViewRotated(false);
        unlockOrientation();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // First Play / Toggle Play handler
  const handleStartPlay = () => {
    setHasStarted(true);
    setIsLoading(true);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        resetControlsTimer();
      } catch {
        setIsPlaying(true);
      }
    }
  };

  const handleTogglePlay = useCallback(() => {
    if (!hasStarted) {
      handleStartPlay();
      return;
    }
    if (!ytPlayerRef.current) return;
    try {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
        resetControlsTimer();
      }
    } catch {
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying, hasStarted, resetControlsTimer]);

  // Seek +/- 10s
  const handleSkip = useCallback(
    (seconds: number) => {
      if (!ytPlayerRef.current) return;
      try {
        const curr = ytPlayerRef.current.getCurrentTime() || currentTime;
        const target = Math.max(0, Math.min(duration || 99999, curr + seconds));
        ytPlayerRef.current.seekTo(target, true);
        setCurrentTime(target);
        resetControlsTimer();

        const side = seconds > 0 ? 'right' : 'left';
        setRippleSide(side);
        setRippleText(seconds > 0 ? `+${seconds}s` : `${seconds}s`);

        if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
        rippleTimerRef.current = setTimeout(() => {
          setRippleSide(null);
        }, 700);
      } catch {}
    },
    [currentTime, duration, resetControlsTimer]
  );

  // Gesture Tap / Double-tap detection
  const handleGestureClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeft = clickX < rect.width / 2;
    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;

    if (timeDiff < 280) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleSkip(isLeft ? -10 : 10);
    } else {
      lastTapTimeRef.current = now;
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = setTimeout(() => {
        setShowControls((prev) => !prev);
        if (!showControls) {
          resetControlsTimer();
        }
      }, 290);
    }
  };

  // Seekbar handlers
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(target, true);
      } catch {}
    }
  };

  // Volume & Mute
  const handleToggleMute = () => {
    if (!ytPlayerRef.current) return;
    try {
      if (isMuted) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      } else {
        ytPlayerRef.current.mute();
        setIsMuted(true);
      }
    } catch {}
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(newVol);
        if (newVol === 0) {
          ytPlayerRef.current.mute();
          setIsMuted(true);
        } else if (isMuted) {
          ytPlayerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {}
    }
  };

  // Speed
  const handleSetSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch {}
    }
    resetControlsTimer();
  };

  // Fullscreen & Side-View (90 degree rotation in portrait)
  const handleEnterFullscreen = useCallback(async () => {
    setIsFullscreen(true);
    // Check if in portrait mobile orientation
    const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
    if (isPortrait) {
      setIsSideViewRotated(true);
    }
    if (containerRef.current && typeof containerRef.current.requestFullscreen === 'function') {
      try {
        await containerRef.current.requestFullscreen().catch(() => {});
      } catch {}
    }
    await lockLandscapeOrientation();
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setIsSideViewRotated(false);
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      try {
        document.exitFullscreen().catch(() => {});
      } catch {}
    }
    unlockOrientation();
    resetControlsTimer();
  }, [resetControlsTimer]);

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      handleEnterFullscreen();
    } else {
      handleExitFullscreen();
    }
  };

  const handleToggleSideViewRotation = () => {
    setIsSideViewRotated((prev) => !prev);
    resetControlsTimer();
  };

  // Responsive Styles with Side-View 90deg rotation support for portrait screens
  const containerStyle: React.CSSProperties = isFullscreen
    ? isSideViewRotated
      ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '100vh',
          height: '100vw',
          transform: 'translate(-50%, -50%) rotate(90deg)',
          transformOrigin: 'center center',
          zIndex: 999999,
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }
      : {
          position: 'fixed',
          inset: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }
    : {
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        backgroundColor: '#000000',
        borderRadius: '16px',
        overflow: 'hidden',
      };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseMove={resetControlsTimer}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none ${
        isFullscreen
          ? 'fixed z-[999999] bg-black shadow-2xl'
          : 'relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800'
      }`}
    >
      {/* 
        1. Pure Video Viewport
        Scale 1.08 + overflow: hidden strictly crops out YouTube logo, watermark, and header cards completely
      */}
      <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          id={playerContainerId.current}
          style={{
            width: '100%',
            height: '100%',
            transform: 'scale(1.08)',
            transformOrigin: 'center center',
          }}
          className="w-full h-full"
        />
      </div>

      {/* 
        2. Custom Edu Veda Video Poster (Replaces YouTube Red Central Button)
        Hides YouTube's native logo, thumbnail, and central button entirely
      */}
      {!hasStarted && (
        <div
          onClick={handleStartPlay}
          className="absolute inset-0 z-35 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent pointer-events-none" />

          {/* Big Custom Play Button */}
          <div className="relative mb-4">
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/50 group-hover:scale-105 group-active:scale-95 transition-all border-2 border-white/25">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1.5" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-indigo-500/20 animate-ping pointer-events-none" />
          </div>

          <span className="text-sm sm:text-base font-bold text-white max-w-md line-clamp-1 drop-shadow-md">
            {title || 'Edu Veda Private Lecture'}
          </span>
          <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Click to Stream Lecture in HD</span>
          </div>
        </div>
      )}

      {/* 
        3. Clean Fullscreen Header (Back & Side-View toggles)
      */}
      {isFullscreen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent px-4 sm:px-6 py-3.5 flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2.5 max-w-[70%]">
            <button
              type="button"
              onClick={handleExitFullscreen}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block drop-shadow-sm">
              {title || 'Edu Veda Private Stream'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Side-View Landscape Switcher */}
            <button
              type="button"
              onClick={handleToggleSideViewRotation}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-90 ${
                isSideViewRotated
                  ? 'bg-indigo-600 text-white border border-indigo-400'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
              title="Toggle Portrait Side-View (90° Rotation)"
            >
              <Smartphone className={`w-4 h-4 ${isSideViewRotated ? 'rotate-90' : ''}`} />
              <span className="hidden sm:inline">{isSideViewRotated ? 'Side-View ON' : 'Rotate Side-View'}</span>
            </button>

            <button
              type="button"
              onClick={handleExitFullscreen}
              className="w-9 h-9 rounded-xl bg-white/20 hover:bg-rose-600/90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md active:scale-90"
              title="Exit Fullscreen (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 
        4. Transparent Gesture Interaction Surface (z-index: 20)
      */}
      {hasStarted && (
        <div
          onClick={handleGestureClick}
          className="absolute inset-0 z-20 w-full h-full cursor-pointer select-none bg-transparent"
          aria-label="Private stream interaction layer"
        >
          {/* Double-Tap Visual Indicator Left (-10s) */}
          {rippleSide === 'left' && (
            <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-white/15 backdrop-blur-xs flex flex-col items-center justify-center text-white rounded-r-full animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/75 flex items-center justify-center mb-1 shadow-lg border border-white/20">
                <Rewind className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-xs font-extrabold tracking-wider bg-black/80 px-2.5 py-0.5 rounded-full border border-white/20">
                {rippleText}
              </span>
            </div>
          )}

          {/* Double-Tap Visual Indicator Right (+10s) */}
          {rippleSide === 'right' && (
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/15 backdrop-blur-xs flex flex-col items-center justify-center text-white rounded-l-full animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/75 flex items-center justify-center mb-1 shadow-lg border border-white/20">
                <FastForward className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-xs font-extrabold tracking-wider bg-black/80 px-2.5 py-0.5 rounded-full border border-white/20">
                {rippleText}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 
        5. Big Center Play Button (Visible when paused after started)
      */}
      {hasStarted && !isLoading && !isPlaying && isPlayerReady && (
        <button
          type="button"
          onClick={handleTogglePlay}
          className="absolute inset-0 m-auto z-30 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/95 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 transition-transform active:scale-90 cursor-pointer backdrop-blur-xs border-2 border-white/20"
          aria-label="Play Stream"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1.5" />
        </button>
      )}

      {/* 
        6. Stream Loading Spinner
      */}
      {hasStarted && isLoading && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none">
          <Loader2 className="w-9 h-9 animate-spin text-indigo-400 mb-2.5" />
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connecting Private HD Stream...</span>
          </div>
        </div>
      )}

      {/* 
        7. Custom Edu Veda Classroom Controls Bar (Bottom)
      */}
      {hasStarted && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3.5 sm:p-4 pt-6 transition-opacity duration-300 text-white pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Custom Progress Scrubber */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-medium text-slate-300 min-w-[34px]">
              {formatTime(currentTime)}
            </span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 300}
                step="1"
                value={currentTime}
                onChange={handleSeekChange}
                className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
              />
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-300 min-w-[34px] text-right">
              {formatTime(duration || 300)}
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer active:scale-95 bg-white/10"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              {/* Rewind 10s */}
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Forward 10s */}
              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-12 sm:w-16 h-1 bg-white/25 rounded appearance-none cursor-pointer accent-indigo-500 hidden sm:block"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Speed Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-bold transition-colors cursor-pointer border border-white/10"
                >
                  {playbackRate}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-9 right-0 bg-slate-900/95 border border-slate-700 backdrop-blur-md rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-40 min-w-[70px]">
                    {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => handleSetSpeed(speed)}
                        className={`px-2.5 py-1 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          playbackRate === speed
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Toggle with Side-View */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer active:scale-95 bg-white/10 border border-white/10"
                title={isFullscreen ? 'Exit Fullscreen' : 'Landscape Side-View Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * HTML5 Video Player
 */
const HTML5VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  onProgressUpdate,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const onProgressUpdateRef = useRef(onProgressUpdate);
  onProgressUpdateRef.current = onProgressUpdate;

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        controls
        preload="metadata"
        onTimeUpdate={() => {
          if (videoRef.current) {
            const current = videoRef.current.currentTime;
            setCurrentTime(current);
            const total = videoRef.current.duration || 1;
            const percent = Math.min(100, Math.round((current / total) * 100));
            onProgressUpdateRef.current?.(percent, current);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onProgressUpdateRef.current?.(100, duration);
          onEndedRef.current?.();
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
