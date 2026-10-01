import React, { useEffect, useState } from 'react';
import {
  Award,
  TrendingUp,
  Video,
  CheckCircle2,
  BookOpen,
  Flame,
  ChevronRight,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { subscribeToUserProgress, computeStudyStats, type CalculatedStudyStats } from '../services/progress';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { subscribeToAllPublishedTopics } from '../services/topics';
import { subscribeToAllPublishedMCQs } from '../services/mcqs';
import { fetchAllPublishedLectures } from '../services/lectures';
import type { Subject, Topic, MCQ, Lecture, UserProgress } from '../types';

interface RealProgressTrackerProps {
  onSelectSubject?: (subjectId: string) => void;
  onSelectTopic?: (topicId: string, subjectId?: string) => void;
  onSelectLecture?: (lectureId: string) => void;
  variant?: 'card' | 'compact' | 'full';
}

export const RealProgressTracker: React.FC<RealProgressTrackerProps> = ({
  onSelectSubject,
  onSelectTopic,
  onSelectLecture,
  variant = 'card',
}) => {
  const { user } = useAuth();
  const { playTap } = useAudio();

  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllSubjects, setShowAllSubjects] = useState<boolean>(false);

  // Subscribe to real data
  useEffect(() => {
    let unsubProgress = () => {};
    if (user) {
      unsubProgress = subscribeToUserProgress(user.uid, list => {
        setProgressList(list || []);
      });
    }

    const unsubSubjects = subscribeToPublishedSubjects(data => {
      setSubjects(data || []);
      setLoading(false);
    });

    const unsubTopics = subscribeToAllPublishedTopics(data => {
      setTopics(data || []);
    });

    const unsubMCQs = subscribeToAllPublishedMCQs(data => {
      setMcqs(data || []);
    });

    fetchAllPublishedLectures().then(data => {
      setLectures(data || []);
    });

    return () => {
      unsubProgress();
      unsubSubjects();
      unsubTopics();
      unsubMCQs();
    };
  }, [user]);

  // Compute stats dynamically
  const stats: CalculatedStudyStats = computeStudyStats(
    progressList,
    topics,
    lectures,
    subjects.map(s => ({ id: s.id, name: s.name })),
    mcqs.length
  );

  // Find latest active lesson for "Resume Learning" button
  const latestProgress = progressList[0];
  const lastActiveTopic = latestProgress ? topics.find(t => t.id === latestProgress.topicId) : null;
  const lastActiveSubject = lastActiveTopic ? subjects.find(s => s.id === lastActiveTopic.subjectId) : null;

  const motivationalMessage =
    stats.overallPercentage === 100
      ? 'Outstanding! 100% of the syllabus has been mastered! 🏆'
      : stats.overallPercentage >= 75
      ? 'Almost exam-ready! Excellent dedication! 🌟'
      : stats.overallPercentage >= 40
      ? 'Halfway mark crossed! Keep up the daily study streak! 🚀'
      : stats.overallPercentage > 0
      ? 'Great start! Continue with video lectures & practice quizzes! 📚'
      : 'Start your preparation journey with your first lecture today! ✨';

  return (
    <div className="w-full bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-indigo-700/50 relative overflow-hidden">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none -ml-8 -mb-8" />

      <div className="relative z-10 space-y-4">
        {/* Top Title & Real Streak Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/10 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-widest block">
                Real Preparation Tracker
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
                Syllabus Progress
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black shadow-xs backdrop-blur-md">
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{stats.studyStreakDays} {stats.studyStreakDays === 1 ? 'Day' : 'Days'} Streak</span>
          </div>
        </div>

        {/* Big Real Completion Percentage & Gauge */}
        <div className="bg-black/30 rounded-2xl p-3.5 border border-white/10 backdrop-blur-md space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums">
                {stats.overallPercentage}%
              </span>
              <span className="text-xs text-indigo-200 font-semibold">
                Completed
              </span>
            </div>

            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {stats.completedTopicsCount} of {stats.totalTopicsCount} Lessons Done
            </span>
          </div>

          {/* Real Animated Progress Bar */}
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400 shadow-lg shadow-indigo-500/50"
              style={{ width: `${Math.max(stats.overallPercentage, 3)}%` }}
            />
          </div>

          <p className="text-[11px] text-indigo-200/90 leading-snug flex items-center gap-1.5 pt-0.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{motivationalMessage}</span>
          </p>
        </div>

        {/* 4 Detailed Real Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Lectures Watched */}
          <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-indigo-200 block truncate font-medium">Lectures Watched</span>
              <span className="font-extrabold text-white text-xs sm:text-sm tabular-nums">
                {stats.completedLecturesCount} <span className="text-[10px] text-indigo-300 font-normal">/ {stats.totalLecturesCount}</span>
              </span>
            </div>
          </div>

          {/* Quizzes Mastered */}
          <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-indigo-200 block truncate font-medium">MCQs Completed</span>
              <span className="font-extrabold text-white text-xs sm:text-sm tabular-nums">
                {stats.completedMCQsCount} <span className="text-[10px] text-indigo-300 font-normal">/ {stats.totalMCQsCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Real Progress Breakdown */}
        {subjects.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">
                Subject-Wise Coverage
              </span>
              {subjects.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    playTap();
                    setShowAllSubjects(!showAllSubjects);
                  }}
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  {showAllSubjects ? 'Show Less' : `View All (${subjects.length})`}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {(showAllSubjects ? subjects : subjects.slice(0, 3)).map(sub => {
                const subStat = stats.subjectBreakdown.find(b => b.subjectId === sub.id) || {
                  percentage: 0,
                  completedTopics: 0,
                  totalTopics: topics.filter(t => t.subjectId === sub.id).length || 1,
                };

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      playTap();
                      onSelectSubject?.(sub.id);
                    }}
                    className="bg-white/5 hover:bg-white/15 p-2.5 rounded-2xl border border-white/10 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white truncate max-w-[70%]">
                        {sub.name}
                      </span>
                      <span className="text-[11px] font-extrabold text-amber-300 tabular-nums">
                        {subStat.percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(subStat.percentage, 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Action: Resume Last Studied Lesson */}
        {lastActiveTopic && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                playTap();
                if (latestProgress?.lectureId && onSelectLecture) {
                  onSelectLecture(latestProgress.lectureId);
                } else if (onSelectTopic) {
                  onSelectTopic(lastActiveTopic.id, lastActiveTopic.subjectId);
                }
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-white text-indigo-900 font-extrabold text-xs shadow-lg hover:bg-indigo-50 active:scale-98 transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Play className="w-3.5 h-3.5 fill-indigo-900 text-indigo-900 shrink-0" />
                <span className="truncate">
                  Resume: <strong className="font-black">{lastActiveTopic.title}</strong>
                </span>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 text-indigo-900" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
