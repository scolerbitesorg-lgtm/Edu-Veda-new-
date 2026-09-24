import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  FileText,
  ExternalLink,
  Download,
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  Volume2,
  Play,
  Pause,
  Square,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';
import { subscribeToNoteById } from '../services/notes';
import { saveUserProgress, fetchUserProgress } from '../services/progress';
import { isNoteSaved, toggleSaveNote } from '../services/bookmarks';
import { generateNotesSummary } from '../services/ai';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import type { Note } from '../types';

interface NoteViewerPageProps {
  noteId: string;
  onBack: () => void;
}

export const NoteViewerPage: React.FC<NoteViewerPageProps> = ({ noteId, onBack }) => {
  const { user } = useAuth();
  const {
    playTap,
    playSuccess,
    speakText,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    isSpeaking,
    isPaused,
    speechRate,
    setSpeechRate,
  } = useAudio();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToNoteById(noteId, fetched => {
      setNote(fetched);
      setLoading(false);
    });

    return () => {
      unsub();
      stopSpeech(); // Stop TTS audio playback when navigating away
    };
  }, [noteId, stopSpeech]);

  // Check if previously completed & auto-record read progress after 3 seconds of active reading
  useEffect(() => {
    if (!user || !note?.topicId) return;

    fetchUserProgress(user.uid).then(progressList => {
      const found = progressList.find(p => p.topicId === note.topicId);
      if (found?.completed) {
        setIsCompleted(true);
      }
    });

    const timer = setTimeout(() => {
      if (note.topicId) {
        saveUserProgress(user.uid, note.topicId, undefined, 100, true);
        setIsCompleted(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, note?.topicId]);

  const handleMarkAsRead = async () => {
    playSuccess();
    setIsCompleted(true);
    if (note?.topicId && user) {
      await saveUserProgress(user.uid, note.topicId, undefined, 100, true);
    }
  };

  const handleCopyText = () => {
    if (!note?.content) return;
    playTap();
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSummary = async () => {
    if (!note) return;
    playTap();
    setShowSummaryModal(true);
    if (aiSummary) return;

    setIsGeneratingSummary(true);
    try {
      const summary = await generateNotesSummary({
        topicTitle: note.title,
        content: note.content || `${note.title} study notes and syllabus document.`,
      });
      setAiSummary(summary);
      playSuccess();
    } catch {
      setAiSummary('AI Revision Summary: Focus on core definitions, formulas, and textbook key questions.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const isPdf =
    note?.type === 'pdf' ||
    Boolean(note?.pdfUrl) ||
    Boolean(note?.storagePath?.toLowerCase().endsWith('.pdf'));

  const pdfUrl = note?.pdfUrl || note?.storagePath || '';

  const fontSizeClass =
    fontSize === 'normal'
      ? 'text-sm leading-relaxed'
      : fontSize === 'large'
      ? 'text-base leading-relaxed'
      : 'text-lg leading-relaxed';

  // Toggle or start TTS speech of notes
  const handleToggleSpeech = () => {
    playTap();
    if (isSpeaking) {
      if (isPaused) {
        resumeSpeech();
      } else {
        pauseSpeech();
      }
    } else {
      const textToRead = note?.content || `${note?.title}. PDF notes summary and key revision points.`;
      speakText(`${note?.title}. ${textToRead}`);
    }
  };

  const handleCycleSpeed = () => {
    playTap();
    const speeds = [1.0, 1.25, 1.5, 0.85];
    const nextIdx = (speeds.indexOf(speechRate) + 1) % speeds.length;
    setSpeechRate(speeds[nextIdx] || 1.0);
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-2 animate-in fade-in duration-150">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playTap();
              stopSpeech();
              onBack();
            }}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95 shadow-xs cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Study Material
          </span>
        </div>

        {/* Font resize and Mark Read controls */}
        {note && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGenerateSummary}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title="AI Quick Summary"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">AI Summary</span>
            </button>

            {!isPdf && (
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setFontSize(fontSize === 'xlarge' ? 'large' : 'normal');
                  }}
                  className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer"
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setFontSize(fontSize === 'normal' ? 'large' : 'xlarge');
                  }}
                  className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 active:scale-95 transition-all border-l border-slate-100 cursor-pointer"
                  title="Increase Font Size"
                >
                  A+
                </button>
              </div>
            )}

            {user && (
              <button
                type="button"
                onClick={() => {
                  playTap();
                  toggleSaveNote(user.uid, note);
                }}
                className={`p-2 rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  isNoteSaved(user.uid, note.id)
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                }`}
                title={isNoteSaved(user.uid, note.id) ? 'Saved' : 'Save Note'}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    isNoteSaved(user.uid, note.id) ? 'fill-current' : ''
                  }`}
                />
              </button>
            )}

            <button
              type="button"
              onClick={handleMarkAsRead}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Read' : 'Mark Read'}</span>
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12">
          <LoadingState variant="inline" message="Opening study note..." />
        </div>
      )}

      {!loading && !note && (
        <EmptyState
          title="Note Not Found"
          description="The selected study document does not exist or has been removed."
          actionText="Go Back"
          onAction={onBack}
        />
      )}

      {!loading && note && (
        <>
          {/* Note Title Header Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isPdf
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                {isPdf ? 'PDF Document' : 'Revision Summary'}
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">Full Dedicated Page</span>
            </div>

            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {note.title}
            </h1>
          </div>

          {/* Text-To-Speech (TTS) Audio Player Bar */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isSpeaking && !isPaused
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-white/10 text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">AI Audio Reader</span>
                  {isSpeaking && !isPaused && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <p className="text-[10px] text-indigo-200 truncate">
                  {isSpeaking
                    ? isPaused
                      ? 'Audio Paused'
                      : 'Reading note aloud...'
                    : 'Listen to speech summary'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Speed Button */}
              <button
                type="button"
                onClick={handleCycleSpeed}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                title="Playback Speed"
              >
                {speechRate}x
              </button>

              {/* Play / Pause Button */}
              <button
                type="button"
                onClick={handleToggleSpeech}
                className="w-8 h-8 rounded-xl bg-white text-indigo-900 flex items-center justify-center hover:bg-indigo-50 transition-all active:scale-95 shadow-xs font-bold cursor-pointer"
                title={isSpeaking && !isPaused ? 'Pause Speech' : 'Play Speech'}
              >
                {isSpeaking && !isPaused ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Stop Button */}
              {isSpeaking && (
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    stopSpeech();
                  }}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  title="Stop Speech"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Content Body */}
          {isPdf ? (
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {note.title}.pdf
                    </span>
                    <span className="text-[10px] text-slate-500">PDF Reader Mode</span>
                  </div>
                </div>

                {pdfUrl && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={pdfUrl}
                      download={`${note.title}.pdf`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
                    >
                      <span>Fullscreen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Embedded PDF Viewer */}
              {pdfUrl ? (
                <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                      pdfUrl
                    )}&embedded=true`}
                    title={note.title}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  PDF document URL not available.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Document Text
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Notes</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className={`text-slate-800 whitespace-pre-wrap ${fontSizeClass} font-normal selection:bg-indigo-100 selection:text-indigo-900`}
              >
                {note.content || 'Detailed notes for this lesson will be posted soon.'}
              </div>
            </div>
          )}
        </>
      )}

      {/* AI Quick Revision Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-6 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Revision Summary</h3>
                  <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{note?.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setShowSummaryModal(false);
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {isGeneratingSummary ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  <span className="text-xs font-medium text-slate-500">
                    Generating high-yield summary...
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed space-y-2">
                  {aiSummary}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex justify-end">
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setShowSummaryModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
