import React, { createContext, useContext, useState, useEffect } from 'react';

interface AudioContextType {
  isMuted: boolean;
  soundEnabled: boolean;
  toggleMute: () => void;
  toggleSound: () => void;
  playTap: () => void;
  playSuccess: () => void;
  playWrong: () => void;
  playError: () => void;
  playComplete: () => void;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('edu_veda_muted') === 'true';
  });

  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('edu_veda_muted', String(isMuted));
  }, [isMuted]);

  const getAudioContext = () => {
    if (audioCtx) return audioCtx;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setAudioCtx(ctx);
      return ctx;
    } catch {
      return null;
    }
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      }, delay);
    } catch (e) {
      console.warn('Audio synthesis unavailable:', e);
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const playTap = () => {
    playTone(520, 'sine', 0.05);
  };

  const playSuccess = () => {
    playTone(587.33, 'sine', 0.1, 0); // D5
    playTone(880, 'sine', 0.2, 80);   // A5
  };

  const playWrong = () => {
    playTone(280, 'triangle', 0.15, 0);
    playTone(220, 'triangle', 0.2, 100);
  };

  const playComplete = () => {
    playTone(523.25, 'sine', 0.1, 0);   // C5
    playTone(659.25, 'sine', 0.12, 90);  // E5
    playTone(783.99, 'sine', 0.15, 180); // G5
    playTone(1046.5, 'sine', 0.3, 270);  // C6
  };

  return (
    <AudioCtx.Provider
      value={{
        isMuted,
        soundEnabled: !isMuted,
        toggleMute,
        toggleSound: toggleMute,
        playTap,
        playSuccess,
        playWrong,
        playError: playWrong,
        playComplete,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioCtx);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
