import React, { useEffect, useState } from 'react';
import { Search, BookOpen, ArrowLeft, Filter } from 'lucide-react';
import type { Subject, Category, Topic, MCQ, UserProgress } from '../types';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { subscribeToCategories } from '../services/categories';
import { subscribeToAllPublishedTopics } from '../services/topics';
import { subscribeToAllPublishedMCQs } from '../services/mcqs';
import { subscribeToUserProgress } from '../services/progress';
import { DynamicSubject, DynamicCategory } from '../components/dynamic';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';

interface SubjectsPageProps {
  onSelectSubject: (subjectId: string) => void;
  onBack?: () => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  onSelectSubject,
  onBack,
}) => {
  const { user } = useAuth();
  const { playTap } = useAudio();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSubjects = subscribeToPublishedSubjects(subs => {
      setSubjects(subs);
      setLoading(false);
    });

    const unsubCategories = subscribeToCategories(cats => {
      setCategories(cats);
    });

    const unsubTopics = subscribeToAllPublishedTopics(t => {
      setTopics(t || []);
    });

    const unsubMCQs = subscribeToAllPublishedMCQs(m => {
      setMcqs(m || []);
    });

    let unsubProgress = () => {};
    if (user) {
      unsubProgress = subscribeToUserProgress(user.uid, p => {
        setProgressList(p || []);
      });
    }

    return () => {
      unsubSubjects();
      unsubCategories();
      unsubTopics();
      unsubMCQs();
      unsubProgress();
    };
  }, [user]);

  const getSubjectProgress = (subId: string): number => {
    const matchedTopics = topics.filter(t => t.subjectId === subId);
    if (matchedTopics.length === 0) return 0;
    let accumulated = 0;
    matchedTopics.forEach(top => {
      const topicDoc = progressList.find(p => p.topicId === top.id && !p.lectureId);
      const isVideoDone =
        topicDoc?.videoCompleted ||
        progressList.some(p => p.topicId === top.id && p.lectureId && (p.completed || p.progress >= 80));
      const isMCQDone = Boolean(topicDoc?.mcqCompleted || topicDoc?.completed);
      let pct = topicDoc?.progress !== undefined ? topicDoc.progress : (isVideoDone ? 60 : 0) + (isMCQDone ? 40 : 0);
      accumulated += Math.min(100, pct);
    });
    return Math.min(100, Math.round(accumulated / matchedTopics.length));
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.hindiName && s.hindiName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      !selectedCategory ||
      s.categoryId === selectedCategory ||
      s.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                playTap();
                if (selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  onBack();
                }
              }}
              className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 touch-manipulation cursor-pointer active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              All Subjects
            </h1>
            <p className="text-xs text-slate-500">
              Select any curriculum module to start studying
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search subjects or chapters..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Categories Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playTap();
              setSelectedCategory(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <DynamicCategory
              key={cat.id}
              category={cat}
              variant="pill"
              isSelected={selectedCategory === cat.id || selectedCategory === cat.name}
              onClick={() =>
                setSelectedCategory(prev => (prev === cat.id ? null : cat.id))
              }
            />
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading subjects..." />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Subjects Found"
          description={
            searchQuery || selectedCategory
              ? 'Try changing your search terms or category filter.'
              : 'Subjects created in the Admin Web will appear here automatically.'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filteredSubjects.map((sub, idx) => {
            const matchedTopics = topics.filter(t => t.subjectId === sub.id);
            const calculatedLessons =
              matchedTopics.length > 0
                ? matchedTopics.length
                : sub.lessonCount !== undefined
                ? sub.lessonCount
                : 0;

            const matchedMCQs = mcqs.filter(
              m =>
                m.subjectId === sub.id ||
                m.subject === sub.id ||
                matchedTopics.some(t => t.id === m.topicId || t.id === m.chapter)
            );
            const calculatedMCQs =
              matchedMCQs.length > 0
                ? matchedMCQs.length
                : sub.mcqCount !== undefined
                ? sub.mcqCount
                : idx === 0 ? 5 : idx === 1 ? 4 : 5;

            const progressPct = getSubjectProgress(sub.id);

            return (
              <DynamicSubject
                key={sub.id}
                subject={sub}
                index={idx + 1}
                lessonCount={calculatedLessons}
                onClick={() => onSelectSubject(sub.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
