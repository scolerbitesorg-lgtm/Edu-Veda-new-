import React, { useEffect, useState } from 'react';
import { ChevronLeft, Layers, FolderOpen } from 'lucide-react';
import { TopicCard } from '../components/TopicCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { subscribeToSubjectById } from '../services/subjects';
import { subscribeToTopicsBySubject } from '../services/topics';
import { subscribeToUserProgress } from '../services/progress';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import type { Subject, Topic, UserProgress } from '../types';

interface SubjectDetailPageProps {
  subjectId: string;
  onBack: () => void;
  onSelectTopic: (topicId: string) => void;
}

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subjectId,
  onBack,
  onSelectTopic,
}) => {
  const { user } = useAuth();
  const { playTap } = useAudio();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);

  // Real-time synchronization from Firestore
  useEffect(() => {
    const unsubSubject = subscribeToSubjectById(subjectId, s => {
      setSubject(s);
      setLoading(false);
    });

    const unsubTopics = subscribeToTopicsBySubject(subjectId, t => {
      setTopics(t || []);
    });

    let unsubProgress = () => {};
    if (user) {
      unsubProgress = subscribeToUserProgress(user.uid, list => {
        if (list) setProgressList(list);
      });
    }

    return () => {
      unsubSubject();
      unsubTopics();
      unsubProgress();
    };
  }, [subjectId, user]);

  const getTopicProgress = (topicId: string): number => {
    const direct = progressList.find(p => p.topicId === topicId && !p.lectureId);
    if (direct?.progress !== undefined && direct.progress > 0) return direct.progress;
    const hasVideo =
      direct?.videoCompleted ||
      progressList.some(
        p => p.topicId === topicId && p.lectureId && (p.completed || p.progress >= 80)
      );
    const hasMCQ = Boolean(direct?.mcqCompleted || direct?.completed);
    return Math.min(100, (hasVideo ? 60 : 0) + (hasMCQ ? 40 : 0));
  };

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
          Subject Curriculum
        </span>
      </div>

      {loading && (
        <div className="py-12">
          <LoadingState variant="inline" message="Loading subject..." />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => {}} />}

      {!loading && !error && !subject && (
        <EmptyState
          title="Subject Not Found"
          description="This subject does not exist or has been removed."
          actionText="Go Back"
          onAction={onBack}
        />
      )}

      {!loading && !error && subject && (
        <>
          {/* Subject Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.03)] relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Subject Syllabus
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1">
              {subject.name}
            </h1>
            {subject.description && (
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                {subject.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>{topics.length} {topics.length === 1 ? 'Lesson' : 'Lessons'} Available</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>·</span>
                <span>Lectures, Notes & MCQs</span>
              </div>
            </div>
          </div>

          {/* Topics List */}
          <section className="space-y-2.5 pt-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
              Lessons in this Subject
            </h2>

            {topics.length === 0 ? (
              <EmptyState
                title="No Lessons Published"
                description="Lessons for this subject will appear here in real time once added to the database."
                icon={FolderOpen}
              />
            ) : (
              topics.map((topic, index) => {
                const topicProgress = getTopicProgress(topic.id);
                return (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    index={index}
                    progressPercent={topicProgress}
                    isCompleted={topicProgress >= 100}
                    onClick={() => {
                      playTap();
                      onSelectTopic(topic.id);
                    }}
                  />
                );
              })
            )}
          </section>
        </>
      )}
    </div>
  );
};
