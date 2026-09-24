import React, { useEffect, useState } from 'react';
import { ChevronLeft, Play, Film, Clock } from 'lucide-react';
import { subscribeToLecturesByTopic } from '../services/lectures';
import { subscribeToTopicById } from '../services/topics';
import { LectureCard } from '../components/LectureCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';
import type { Lecture, Topic } from '../types';

interface TopicLecturesListPageProps {
  topicId: string;
  onBack: () => void;
  onSelectLecture: (lectureId: string) => void;
}

export const TopicLecturesListPage: React.FC<TopicLecturesListPageProps> = ({
  topicId,
  onBack,
  onSelectLecture,
}) => {
  const { playTap } = useAudio();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const unsubTopic = subscribeToTopicById(topicId, t => {
      setTopic(t);
    });

    const unsubLectures = subscribeToLecturesByTopic(topicId, l => {
      setLectures(l || []);
      setLoading(false);
    });

    return () => {
      unsubTopic();
      unsubLectures();
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
              {topic?.title || 'Video Lectures'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {lectures.length} {lectures.length === 1 ? 'Video Lesson' : 'Video Lessons'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full space-y-3 select-text">
        {loading ? (
          <div className="py-12">
            <LoadingState variant="inline" message="Loading video lectures..." />
          </div>
        ) : lectures.length === 0 ? (
          <EmptyState
            title="No Lectures Published"
            description="Video lectures for this lesson will appear here once added."
            actionText="Back to Lesson"
            onAction={onBack}
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
    </div>
  );
};
