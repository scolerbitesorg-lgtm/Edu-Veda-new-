import React, { useEffect, useState } from 'react';
import { ChevronLeft, Play, FileText, CheckSquare, FolderOpen } from 'lucide-react';
import { LectureCard } from '../components/LectureCard';
import { NotesCard } from '../components/NotesCard';
import { MCQQuiz } from '../components/MCQQuiz';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { subscribeToTopicById } from '../services/topics';
import { subscribeToLecturesByTopic } from '../services/lectures';
import { subscribeToNotesByTopic } from '../services/notes';
import { subscribeToMCQsByTopic } from '../services/mcqs';
import { useAudio } from '../context/AudioContext';
import type { Topic, Lecture, Note, MCQ } from '../types';

export type TopicTab = 'lectures' | 'notes' | 'mcqs';

interface TopicDetailPageProps {
  topicId: string;
  initialTab?: TopicTab;
  onBack: () => void;
  onSelectLecture: (lectureId: string) => void;
  onSelectNote: (noteId: string) => void;
}

export const TopicDetailPage: React.FC<TopicDetailPageProps> = ({
  topicId,
  initialTab = 'lectures',
  onBack,
  onSelectLecture,
  onSelectNote,
}) => {
  const { playTap } = useAudio();

  const [activeTab, setActiveTab] = useState<TopicTab>(initialTab);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  // Real-time synchronization directly from Firestore
  useEffect(() => {
    const unsubTopic = subscribeToTopicById(topicId, t => {
      setTopic(t);
      setLoading(false);
    });

    const unsubLectures = subscribeToLecturesByTopic(topicId, l => {
      setLectures(l || []);
    });

    const unsubNotes = subscribeToNotesByTopic(topicId, n => {
      setNotes(n || []);
    });

    const unsubMCQs = subscribeToMCQsByTopic(topicId, m => {
      setMCQs(m || []);
    });

    return () => {
      unsubTopic();
      unsubLectures();
      unsubNotes();
      unsubMCQs();
    };
  }, [topicId]);

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-2 animate-in fade-in duration-100">
      {/* Top Header Navigation */}
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
          Lesson Details
        </span>
      </div>

      {loading && (
        <div className="py-12">
          <LoadingState variant="inline" message="Loading lesson details..." />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => {}} />}

      {!loading && !error && !topic && (
        <EmptyState
          title="Lesson Not Found"
          description="This lesson does not exist or has been removed."
          actionText="Go Back"
          onAction={onBack}
        />
      )}

      {!loading && !error && topic && (
        <>
          {/* Topic Title Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                Active Study Unit
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
              {topic.title}
            </h1>
            {topic.description && (
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                {topic.description}
              </p>
            )}
          </div>

          {/* Tab Selector */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                playTap();
                setActiveTab('lectures');
              }}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'lectures'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Lectures ({lectures.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTap();
                setActiveTab('notes');
              }}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'notes'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notes ({notes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playTap();
                setActiveTab('mcqs');
              }}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'mcqs'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>MCQs ({mcqs.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="pt-1">
            {activeTab === 'lectures' && (
              <div className="space-y-3">
                {lectures.length === 0 ? (
                  <EmptyState
                    title="No Video Lectures"
                    description="No video lectures published for this lesson yet."
                    icon={Play}
                  />
                ) : (
                  lectures.map(lecture => (
                    <LectureCard
                      key={lecture.id}
                      lecture={lecture}
                      onClick={() => {
                        playTap();
                        onSelectLecture(lecture.id);
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <EmptyState
                    title="No Study Notes"
                    description="No study notes or PDFs published for this lesson yet."
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
            )}

            {activeTab === 'mcqs' && (
              <div>
                {mcqs.length === 0 ? (
                  <EmptyState
                    title="No Practice MCQs"
                    description="No practice questions published for this lesson yet."
                    icon={CheckSquare}
                  />
                ) : (
                  <MCQQuiz
                    topicId={topic.id}
                    topicTitle={topic.title}
                    mcqs={mcqs}
                    onFinish={() => {}}
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
