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
} from 'lucide-react';
import { subscribeToNoteById, fetchNoteById } from '../services/notes';
import { saveUserProgress, fetchUserProgress } from '../services/progress';
import { isNoteSaved, toggleSaveNote } from '../services/bookmarks';
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
  const { playTap, playSuccess } = useAudio();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToNoteById(noteId, fetched => {
      setNote(fetched);
      setLoading(false);
    });

    return () => unsub();
  }, [noteId]);

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

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-2 animate-in fade-in duration-150">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playTap();
              onBack();
            }}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95 shadow-xs"
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
            {!isPdf && (
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFontSize(fontSize === 'xlarge' ? 'large' : 'normal')}
                  className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 active:scale-95 transition-all"
                  title="Decrease Font Size"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : 'xlarge')}
                  className="px-2 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 active:scale-95 transition-all border-l border-slate-100"
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
                className={`p-2 rounded-xl border transition-all active:scale-95 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 ${
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
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
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
    </div>
  );
};
