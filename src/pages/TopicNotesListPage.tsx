import React, { useEffect, useState } from 'react';
import { ChevronLeft, FileText, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { subscribeToNotesByTopic } from '../services/notes';
import { subscribeToTopicById } from '../services/topics';
import { NotesCard } from '../components/NotesCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';
import type { Note, Topic } from '../types';

interface TopicNotesListPageProps {
  topicId: string;
  onBack: () => void;
  onSelectNote: (noteId: string) => void;
}

export const TopicNotesListPage: React.FC<TopicNotesListPageProps> = ({
  topicId,
  onBack,
  onSelectNote,
}) => {
  const { playTap } = useAudio();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubTopic = subscribeToTopicById(topicId, t => {
      setTopic(t);
    });

    const unsubNotes = subscribeToNotesByTopic(topicId, n => {
      setNotes(n || []);
      setLoading(false);
    });

    return () => {
      unsubTopic();
      unsubNotes();
    };
  }, [topicId]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FD] flex flex-col h-[100dvh] w-full overflow-hidden select-none">
      {/* Top Header */}
      <header className="bg-white px-4 py-3 border-b border-slate-200/80 shadow-2xs shrink-0 z-10">
        <div className="flex items-center gap-3 max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
            aria-label="Back to Lesson"
            title="Back to Lesson"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
              {topic?.title || 'Study Notes'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {notes.length} {notes.length === 1 ? 'Document' : 'Documents'} Available
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full space-y-3 select-text">
        {loading ? (
          <div className="py-12">
            <LoadingState variant="inline" message="Loading study notes..." />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            title="No Notes Published"
            description="Study materials and revision notes for this lesson will appear here."
            actionText="Back to Lesson"
            onAction={onBack}
            icon={FileText}
          />
        ) : (
          notes.map(note => (
            <NotesCard
              key={note.id}
              note={note}
              onClick={() => {
                playTap();
                onSelectNote(note.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
