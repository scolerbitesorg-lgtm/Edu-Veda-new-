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
  ChevronLeft,
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

export const requestFullscreenElement = async (element: HTMLElement | null) => {
  if (!element) return;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (e) {
    console.warn('Fullscreen request failed:', e);
  }
};

export const exitFullscreenElement = async () => {
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
 * YouTube Video Embed Player with clean fullscreen and top Back button
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

  // Automatic watch progress tracker for YouTube
  useEffect(() => {
    // Initial 20% registration
    onProgressUpdate?.(20, 10);

    // Auto-mark completed (100%) after active 20 seconds of lecture presence
    const timer = setTimeout(() => {
      setMarkedDone(true);
      onProgressUpdate?.(100, 60);
      onEnded?.();
    }, 20000);

    return () => clearTimeout(timer);
  }, [ytId]);

  const handleExitFullscreen = useCallback(async () => {
    await exitFullscreenElement();
    setIsFullscreen(false);
    onChangeViewMode?.('standard');
  }, [onChangeViewMode]);

  const handleEnterFullscreen = useCallback(async () => {
    if (containerRef.current) {
      await requestFullscreenElement(containerRef.current);
    }
    setIsFullscreen(true);
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

  const handleMarkComplete = () => {
    setMarkedDone(true);
    onProgressUpdate?.(100, 100);
    onEnded?.();
  };

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-[999999] bg-black flex flex-col justify-between overflow-hidden select-none w-screen h-screen'
    : viewMode === 'half'
    ? 'relative w-full h-full aspect-video sm:h-[48vh] bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800'
    : 'relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between group';

  return (
    <div ref={containerRef} className={containerClasses}>
      {/* Top Header Controls Bar in Fullscreen Mode */}
      {isFullscreen && (
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
          {/* Back Button to Exit Fullscreen */}
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/90 bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 truncate max-w-[200px]">
              {title}
            </span>
            <button
              type="button"
              onClick={handleExitFullscreen}
              className="w-8 h-8 rounded-xl bg-black/80 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg cursor-pointer"
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

      {/* Top Controls Overlay (when not in fullscreen) */}
      {!isFullscreen && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={handleEnterFullscreen}
            className="p-2 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700/60 shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
            title="Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleMarkComplete}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
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
 * HTML5 MP4 / Direct Stream Video Player with clean controls and top Back button
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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
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

  // Fullscreen Handlers
  const handleEnterFullscreen = useCallback(async () => {
    if (containerRef.current) {
      await requestFullscreenElement(containerRef.current);
    }
    setIsFullscreen(true);
    onChangeViewMode?.('fullscreen');
  }, [onChangeViewMode]);

  const handleExitFullscreen = useCallback(async () => {
    await exitFullscreenElement();
    setIsFullscreen(false);
    onChangeViewMode?.('standard');
  }, [onChangeViewMode]);

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      handleEnterFullscreen();
    } else {
      handleExitFullscreen();
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

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-[999999] bg-black flex flex-col justify-between overflow-hidden select-none w-screen h-screen'
    : viewMode === 'half'
    ? 'relative w-full h-[45vh] max-h-[480px] bg-black rounded-2xl overflow-hidden shadow-2xl select-none group'
    : 'relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg select-none group';

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className={containerClasses}
    >
      {/* Top Header in Fullscreen */}
      {isFullscreen && (
        <div
          className={`absolute top-3 left-3 right-3 z-30 flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Back Button to Exit Fullscreen */}
          <button
            type="button"
            onClick={handleExitFullscreen}
            className="px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-xs font-semibold text-white/90 bg-black/70 px-3 py-1.5 rounded-xl border border-white/10 truncate max-w-[250px]">
            {title}
          </span>
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
            // Automatic done triggers when reaching >= 75% watch duration
            if (percent >= 75) {
              onProgressUpdate?.(100, current);
            } else {
              onProgressUpdate?.(percent, current);
            }
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
          onProgressUpdate?.(100, duration);
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

      {/* Big Center Play/Pause Button */}
      {!isLoading && !hasError && !isPlaying && (
        <button
          type="button"
          onClick={handlePlayPause}
          className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 z-10 cursor-pointer"
          aria-label="Play Video"
        >
          <Play className="w-7 h-7 fill-white ml-1" />
        </button>
      )}

      {/* Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 transition-opacity duration-300 text-white z-20 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Scrubber */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-medium text-slate-300">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            />
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-300">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
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
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-indigo-500 hidden sm:block"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-40">
                  {[0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSetSpeed(speed)}
                      className={`px-3 py-1 rounded text-xs text-left transition-colors cursor-pointer ${
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

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
