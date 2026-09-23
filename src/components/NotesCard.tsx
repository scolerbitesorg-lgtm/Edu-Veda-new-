import React from 'react';
import { FileText, FileDown, ChevronRight, Sparkles, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { isNoteSaved, toggleSaveNote } from '../services/bookmarks';
import type { Note } from '../types';

interface NotesCardProps {
  note: Note;
  onClick: () => void;
}

export const NotesCard: React.FC<NotesCardProps> = ({ note, onClick }) => {
  const { user } = useAuth();
  const { playTap } = useAudio();
  const isPdf = note.type === 'pdf';
  const isSaved = user ? isNoteSaved(user.uid, note.id) : false;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 border border-slate-100 shadow-[0_3px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all text-left flex items-center justify-between group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isPdf
              ? 'bg-rose-50 text-rose-600 border border-rose-100'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
          }`}
        >
          {isPdf ? (
            <FileDown className="w-5 h-5 stroke-[1.8]" />
          ) : (
            <FileText className="w-5 h-5 stroke-[1.8]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-800 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
              {note.title}
            </h4>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isPdf
                  ? 'bg-rose-100/70 text-rose-700'
                  : 'bg-indigo-100/70 text-indigo-700'
              }`}
            >
              {note.type}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>High-Yield Revision &bull; Hindi/English</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        {user && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              playTap();
              toggleSaveNote(user.uid, note);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isSaved
                ? 'text-amber-500 bg-amber-50'
                : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isSaved ? 'Saved to bookmarks' : 'Save note'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};
