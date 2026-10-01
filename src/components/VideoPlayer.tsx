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
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

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

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSeconds = Math.floor(seconds);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const h = Math.floor(m / 60);
  if (h > 0) {
    const remM = m % 60;
    return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Global script loader for YouTube API
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }
  ytApiPromise = new Promise(resolve => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve();
    };
    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  });
  return ytApiPromise;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  onBack,
  onProgressUpdate,
  onEnded,
}) => {
  const ytId = extractYouTubeId(src);

  if (ytId) {
    return (
      <CustomYouTubePlayer
        key={ytId}
        videoId={ytId}
        title={title}
        onBack={onBack}
        onProgressUpdate={onProgressUpdate}
        onEnded={onEnded}
      />
    );
  }

  return (
    <CustomHTML5Player
      key={src}
      src={src}
      title={title}
      onBack={onBack}
      onProgressUpdate={onProgressUpdate}
      onEnded={onEnded}
    />
  );
};

/**
 * Clean Custom YouTube Player:
 * - Completely hides YouTube branding, watermark, suggested videos and native clutter
 * - Custom Edu Veda Classroom playback controls (Play/Pause, Seek Bar, -10s, +10s, Speed selector, Volume, Fullscreen)
 * - Automatic real-time progress syncing (updates percentage & marks complete)
 */
interface CustomYouTubePlayerProps {
  videoId: string;
  title: string;
  onBack?: () => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
}

const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({
  videoId,
  title,
  onBack,
  onProgressUpdate,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const iframeContainerId = useRef<string>(`yt_player_${videoId}_${Math.random().toString(36).substring(2, 9)}`);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isApiReady, setIsApiReady] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  // Hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  }, [isPlaying]);

  // Initialize YouTube Player
  useEffect(() => {
    let isCancelled = false;
    setIsBuffering(true);
    setLoadError(false);

    loadYouTubeIframeApi().then(() => {
      if (isCancelled) return;
      try {
        const player = new window.YT.Player(iframeContainerId.current, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            widget_referrer: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (isCancelled) return;
              playerRef.current = e.target;
              setIsApiReady(true);
              setIsBuffering(false);
              const dur = e.target.getDuration();
              if (dur > 0) setDuration(dur);
            },
            onStateChange: (e: any) => {
              if (isCancelled) return;
              // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
              if (e.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
                setHasStarted(true);
                const dur = playerRef.current?.getDuration();
                if (dur > 0) setDuration(dur);
              } else if (e.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
                setShowControls(true);
              } else if (e.data === 3) {
                setIsBuffering(true);
              } else if (e.data === 0) {
                setIsPlaying(false);
                setIsBuffering(false);
                setShowControls(true);
                onEnded?.();
                onProgressUpdate?.(100, duration);
              }
            },
            onError: () => {
              if (isCancelled) return;
              setLoadError(true);
              setIsBuffering(false);
            },
          },
        });
      } catch (err) {
        console.warn('YouTube Player initialization fallback:', err);
        setLoadError(true);
        setIsBuffering(false);
      }
    });

    return () => {
      isCancelled = true;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [videoId]);

  // Real-time progress tracker loop
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const curr = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || duration || 1;
          setCurrentTime(curr);
          if (dur > 0) {
            setDuration(dur);
            const pct = Math.min(100, Math.max(0, Math.round((curr / dur) * 100)));
            onProgressUpdate?.(pct, curr);
            if (pct >= 85) {
              onEnded?.();
            }
          }
        }
      }, 500);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, duration, onProgressUpdate, onEnded]);

  // Play / Pause toggle
  const togglePlay = () => {
    resetControlsTimer();
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Skip -10s / +10s
  const seekRelative = (deltaSeconds: number) => {
    resetControlsTimer();
    if (!playerRef.current) return;
    const target = Math.max(0, Math.min(duration || 99999, currentTime + deltaSeconds));
    playerRef.current.seekTo(target, true);
    setCurrentTime(target);
  };

  // Seek bar scrubber
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetControlsTimer();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  // Speed change
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    resetControlsTimer();
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  };

  // Volume toggle
  const toggleMute = () => {
    resetControlsTimer();
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    resetControlsTimer();
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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={resetControlsTimer}
      className={`relative w-full bg-slate-950 overflow-hidden shadow-2xl select-none group transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen flex flex-col justify-center items-center bg-black'
          : 'aspect-video rounded-3xl border border-slate-800'
      }`}
    >
      {/* 
        1. Clean YouTube IFrame Container
        - Scaled slightly (scale-[1.04]) to clip YouTube top bar & bottom-right watermark
        - pointer-events: none when custom controls are active so touch/mouse controls our sleek UI
      */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden bg-black pointer-events-none">
        <div
          id={iframeContainerId.current}
          className="w-full h-full scale-[1.04] transform-gpu pointer-events-none"
        />
      </div>

      {/* 
        2. Top Mask & Branding Guard
        - Elegantly conceals any YouTube top title / share icons
        - Displays native Edu Veda Classroom Header
      */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/95 via-black/60 to-transparent px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 max-w-[75%] min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onBack();
              }}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow-md">
            {title || 'Edu Veda Classroom Lecture'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] sm:text-xs font-bold shadow-xs backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edu Veda Private Class</span>
          </div>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 
        3. Bottom-Right Corner Masking Patch
        - Completely covers any residual YouTube watermark/logo
      */}
      <div className="absolute bottom-0 right-0 w-24 h-12 pointer-events-none z-20 bg-gradient-to-tl from-black/80 to-transparent" />

      {/* 
        4. Interactive Central Click Overlay (Click anywhere to Play/Pause)
      */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer pointer-events-auto"
      >
        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-indigo-400 shadow-2xl border border-indigo-500/30 animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        )}

        {/* Big Center Play Button when Paused */}
        {!isPlaying && !isBuffering && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 backdrop-blur-md transform transition-all active:scale-90 hover:scale-105 border-2 border-white/20 cursor-pointer"
            aria-label="Play Lecture"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
          </button>
        )}
      </div>

      {/* 
        5. Bottom Custom Control Bar
        - Play/Pause, -10s, +10s, Scrubber, Time, Speed, Volume, Fullscreen
      */}
      <div
        onClick={e => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 sm:px-5 pt-6 pb-3 space-y-2 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar (Scrubber) */}
        <div className="relative group/scrub flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all"
            style={{
              background: `linear-gradient(to right, #6366f1 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
            }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs sm:text-sm pt-1">
          {/* Left Actions: Play/Pause, -10s, +10s, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              type="button"
              onClick={() => seekRelative(-10)}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer flex items-center gap-0.5 text-[11px] font-bold"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">10s</span>
            </button>

            <button
              type="button"
              onClick={() => seekRelative(10)}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer flex items-center gap-0.5 text-[11px] font-bold"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">10s</span>
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Actions: Speed, Fullscreen */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] sm:text-xs font-bold transition-all cursor-pointer border border-white/10 flex items-center gap-1"
              >
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 min-w-[70px] z-50 backdrop-blur-md">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleRateChange(speed)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        playbackRate === speed
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Fallback load error banner */}
      {loadError && (
        <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-sm font-bold text-white mb-2">Video playback could not be initiated</p>
          <p className="text-xs text-slate-400 max-w-xs mb-4">Please verify your network connection or try reopening the lecture.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Retry Video
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Standard HTML5 Video Player with Identical Sleek Edu Veda Classroom UI
 */
interface CustomHTML5PlayerProps {
  src: string;
  title: string;
  onBack?: () => void;
  onProgressUpdate?: (percent: number, currentTime: number) => void;
  onEnded?: () => void;
}

const CustomHTML5Player: React.FC<CustomHTML5PlayerProps> = ({
  src,
  title,
  onBack,
  onProgressUpdate,
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  const controlsTimeoutRef = useRef<any>(null);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    resetControlsTimer();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || duration || 1;
    setCurrentTime(curr);
    if (dur > 0) {
      setDuration(dur);
      const pct = Math.min(100, Math.max(0, Math.round((curr / dur) * 100)));
      onProgressUpdate?.(pct, curr);
      if (pct >= 85) {
        onEnded?.();
      }
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    resetControlsTimer();
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetControlsTimer();
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    resetControlsTimer();
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    resetControlsTimer();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    resetControlsTimer();
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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
      onClick={resetControlsTimer}
      className={`relative w-full bg-slate-950 overflow-hidden shadow-2xl select-none group transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] h-screen w-screen flex flex-col justify-center items-center bg-black'
          : 'aspect-video rounded-3xl border border-slate-800'
      }`}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
          onProgressUpdate?.(100, duration);
        }}
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Top Header Navigation */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/95 via-black/60 to-transparent px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 max-w-[75%] min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onBack();
              }}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md shrink-0"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow-md">
            {title || 'Edu Veda Classroom Lecture'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] sm:text-xs font-bold shadow-xs backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edu Veda Private Class</span>
          </div>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-95 transition-all cursor-pointer shadow-md"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Play Button Overlay */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer pointer-events-auto"
      >
        {!isPlaying && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 backdrop-blur-md transform transition-all active:scale-90 hover:scale-105 border-2 border-white/20 cursor-pointer"
            aria-label="Play Lecture"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Bottom Custom Controls */}
      <div
        onClick={e => e.stopPropagation()}
        className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 sm:px-5 pt-6 pb-3 space-y-2 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative group/scrub flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-indigo-500 transition-all"
            style={{
              background: `linear-gradient(to right, #6366f1 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs sm:text-sm pt-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              type="button"
              onClick={() => seekRelative(-10)}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer flex items-center gap-0.5 text-[11px] font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">10s</span>
            </button>

            <button
              type="button"
              onClick={() => seekRelative(10)}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer flex items-center gap-0.5 text-[11px] font-bold"
            >
              <RotateCw className="w-4 h-4" />
              <span className="hidden sm:inline">10s</span>
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <span className="text-[11px] sm:text-xs font-semibold text-slate-300 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] sm:text-xs font-bold transition-all cursor-pointer border border-white/10 flex items-center gap-1"
              >
                <span>{playbackRate}x</span>
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 min-w-[70px] z-50 backdrop-blur-md">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleRateChange(speed)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                        playbackRate === speed
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
