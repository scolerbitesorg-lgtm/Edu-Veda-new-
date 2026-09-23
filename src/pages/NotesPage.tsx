import React, { useEffect, useState } from 'react';
import {
  FileText,
  BookOpen,
  Layers,
  FolderOpen,
  Search,
} from 'lucide-react';
import { NotesCard } from '../components/NotesCard';
import { NoteViewerPage } from './NoteViewerPage';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { subscribeToTopicsBySubject, fetchTopicsBySubject } from '../services/topics';
import { subscribeToAllNotes } from '../services/notes';
import { useAudio } from '../context/AudioContext';
import type { Subject, Topic, Note } from '../types';

interface NotesPageProps {
  initialNoteId?: string;
  onSelectTopic?: (topicId: string, subjectId?: string) => void;
  onOpenNote?: (noteId: string) => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({ initialNoteId, onOpenNote }) => {
  const { playTap } = useAudio();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNoteId || null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Real-time synchronization for subjects & notes
  useEffect(() => {
    const unsubSubjects = subscribeToPublishedSubjects(subs => {
      setSubjects(subs || []);
    });

    const unsubNotes = subscribeToAllNotes(liveNotes => {
      const list = liveNotes || [];
      setAllNotes(list);
      filterNotes(list, selectedSubjectId, selectedTopicId, searchQuery);
      setLoading(false);
    });

    let unsubTopics = () => {};
    if (selectedSubjectId) {
      unsubTopics = subscribeToTopicsBySubject(selectedSubjectId, t => {
        setTopics(t || []);
      });
    } else {
      setTopics([]);
    }

    return () => {
      unsubSubjects();
      unsubNotes();
      unsubTopics();
    };
  }, [selectedSubjectId, selectedTopicId, searchQuery]);

  const filterNotes = (
    noteList: Note[],
    subId: string | null,
    topId: string | null,
    queryText: string
  ) => {
    let res = noteList;
    if (topId) {
      res = res.filter(n => n.topicId === topId);
    } else if (subId) {
      res = res.filter(n => n.subjectId === subId);
    }
    if (queryText.trim()) {
      const q = queryText.toLowerCase();
      res = res.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          (n.content && n.content.toLowerCase().includes(q))
      );
    }
    setNotes(res);
  };

  // When subject changes, load topics & filter notes
  const handleSelectSubject = async (subId: string) => {
    playTap();
    if (selectedSubjectId === subId) {
      setSelectedSubjectId(null);
      setSelectedTopicId(null);
      setTopics([]);
      filterNotes(allNotes, null, null, searchQuery);
      return;
    }

    setSelectedSubjectId(subId);
    setSelectedTopicId(null);
    try {
      const t = await fetchTopicsBySubject(subId);
      setTopics(t || []);
      filterNotes(allNotes, subId, null, searchQuery);
    } catch {
      filterNotes(allNotes, subId, null, searchQuery);
    }
  };

  // When topic is filtered
  const handleSelectTopic = (topicId: string) => {
    playTap();
    if (selectedTopicId === topicId) {
      setSelectedTopicId(null);
      filterNotes(allNotes, selectedSubjectId, null, searchQuery);
      return;
    }

    setSelectedTopicId(topicId);
    filterNotes(allNotes, selectedSubjectId, topicId, searchQuery);
  };

  const handleNoteClick = (noteId: string) => {
    playTap();
    if (onOpenNote) {
      onOpenNote(noteId);
    } else {
      setSelectedNoteId(noteId);
    }
  };

  // If a note is opened, render the dedicated NoteViewerPage
  if (selectedNoteId) {
    return (
      <NoteViewerPage
        noteId={selectedNoteId}
        onBack={() => setSelectedNoteId(null)}
      />
    );
  }

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Header */}
      <div className="pt-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Study Materials & Revision Notes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          High-yield PDF summaries and revision notes synchronized with the database.
        </p>
      </div>

      {/* Search Bar for Notes */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            filterNotes(allNotes, selectedSubjectId, selectedTopicId, e.target.value);
          }}
          placeholder="Search study notes, concepts, formulas..."
          className="w-full bg-white pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </div>

      {/* Subject Filter Pills (Horizontal Scrollable) */}
      {subjects.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                playTap();
                setSelectedSubjectId(null);
                setSelectedTopicId(null);
                setTopics([]);
                filterNotes(allNotes, null, null, searchQuery);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                !selectedSubjectId
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Subjects ({allNotes.length})
            </button>
            {subjects.map(sub => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectSubject(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>

          {/* Topic Sub-filter if Subject Selected */}
          {topics.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                Filter Lesson:
              </span>
              <button
                type="button"
                onClick={() => {
                  playTap();
                  setSelectedTopicId(null);
                  filterNotes(allNotes, selectedSubjectId, null, searchQuery);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  !selectedTopicId
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Lessons
              </button>
              {topics.map(t => {
                const isSelected = selectedTopicId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTopic(t.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <div className="py-12">
            <LoadingState variant="inline" message="Loading notes..." />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            title="No Study Notes Found"
            description="No notes found in the database. When notes are added, they will appear here."
            icon={FolderOpen}
          />
        ) : (
          notes.map(note => (
            <NotesCard
              key={note.id}
              note={note}
              onClick={() => handleNoteClick(note.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
