import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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
  // Text-To-Speech (TTS) Audio Reader for notes/summaries
  speakText: (text: string, onEnd?: () => void) => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('edu_veda_muted') === 'true';
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speechRate, setSpeechRateState] = useState<number>(1.0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    localStorage.setItem('edu_veda_muted', String(isMuted));
  }, [isMuted]);

  // Unlock AudioContext on first user interaction (required by mobile browsers)
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (e) {
        console.warn('AudioContext init error:', e);
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const getAudioContext = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  const playTone = useCallback(
    (
      freq: number,
      type: OscillatorType,
      duration: number,
      gainLevel: number = 0.15,
      delay: number = 0
    ) => {
      if (isMuted) return;
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        setTimeout(() => {
          try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(gainLevel, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
          } catch {
            // ignore synthesis glitches
          }
        }, delay);
      } catch (e) {
        console.warn('Audio synthesis unavailable:', e);
      }
    },
    [isMuted, getAudioContext]
  );

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const playTap = useCallback(() => {
    playTone(600, 'sine', 0.04, 0.12);
  }, [playTone]);

  const playSuccess = useCallback(() => {
    playTone(523.25, 'sine', 0.09, 0.15, 0); // C5
    playTone(659.25, 'sine', 0.12, 0.18, 70); // E5
    playTone(783.99, 'sine', 0.18, 0.2, 140); // G5
  }, [playTone]);

  const playWrong = useCallback(() => {
    playTone(280, 'triangle', 0.12, 0.2, 0);
    playTone(200, 'sawtooth', 0.18, 0.15, 80);
  }, [playTone]);

  const playComplete = useCallback(() => {
    playTone(523.25, 'sine', 0.1, 0.18, 0); // C5
    playTone(659.25, 'sine', 0.12, 0.2, 90); // E5
    playTone(783.99, 'sine', 0.14, 0.22, 180); // G5
    playTone(1046.5, 'sine', 0.3, 0.25, 270); // C6
  }, [playTone]);

  // ==================== Text-To-Speech (TTS) Engine ====================

  const cleanTextForSpeech = (rawText: string): string => {
    return rawText
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/#+\s?/g, '') // Remove Markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Italic markdown
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/\\\[|\\\]|\\\(|\\\)/g, ' ') // LaTeX brackets
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    activeUtteranceRef.current = null;
  }, []);

  const pauseSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const setSpeechRate = useCallback((rate: number) => {
    setSpeechRateState(rate);
    if (activeUtteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // If currently speaking, we can restart at new rate
      activeUtteranceRef.current.rate = rate;
    }
  }, []);

  const speakText = useCallback(
    (rawText: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this environment');
        return;
      }

      stopSpeech();

      const text = cleanTextForSpeech(rawText);
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Auto-detect Hindi vs English characters
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      utterance.lang = hasDevanagari ? 'hi-IN' : 'en-IN';

      // Pick best matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice = voices.find(
          v =>
            (hasDevanagari && v.lang.startsWith('hi')) ||
            (!hasDevanagari && (v.lang.startsWith('en-IN') || v.lang.startsWith('en')))
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        activeUtteranceRef.current = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [speechRate, stopSpeech]
  );

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
        speakText,
        pauseSpeech,
        resumeSpeech,
        stopSpeech,
        isSpeaking,
        isPaused,
        speechRate,
        setSpeechRate,
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
