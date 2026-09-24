import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Play,
  FileText,
  CheckSquare,
  ArrowRight,
  CheckCircle2,
  Circle,
  Award,
} from 'lucide-react';
import { subscribeToTopicById } from '../services/topics';
import { subscribeToLecturesByTopic } from '../services/lectures';
import { subscribeToNotesByTopic } from '../services/notes';
import { subscribeToMCQsByTopic } from '../services/mcqs';
import { subscribeToUserProgress } from '../services/progress';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import type { Topic, Lecture, Note, MCQ, UserProgress } from '../types';

interface TopicDetailPageProps {
  topicId: string;
  onBack: () => void;
  onOpenMCQs: () => void;
  onOpenNotes: () => void;
  onOpenLectures: () => void;
}

export const TopicDetailPage: React.FC<TopicDetailPageProps> = ({
  topicId,
  onBack,
  onOpenMCQs,
  onOpenNotes,
  onOpenLectures,
}) => {
  const { user } = useAuth();
  const { playTap } = useAudio();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);

  // Real-time listener for topic and its contents count
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

    let unsubProgress = () => {};
    if (user) {
      unsubProgress = subscribeToUserProgress(user.uid, list => {
        setProgressList(list || []);
      });
    }

    return () => {
      unsubTopic();
      unsubLectures();
      unsubNotes();
      unsubMCQs();
      unsubProgress();
    };
  }, [topicId, user]);

  // Topic Progress Calculation (60% Video + 40% MCQ)
  const topicProgressDoc = progressList.find(
    p => p.topicId === topicId && (!p.lectureId || p.id === `${user?.uid}_${topicId}`)
  );

  const isVideoDone = Boolean(
    topicProgressDoc?.videoCompleted ||
      progressList.some(
        p => p.topicId === topicId && p.lectureId && (p.completed || p.progress >= 80)
      )
  );

  const isMCQDone = Boolean(topicProgressDoc?.mcqCompleted || topicProgressDoc?.completed);

  const computedPercent =
    topicProgressDoc?.progress !== undefined
      ? topicProgressDoc.progress
      : (isVideoDone ? 60 : 0) + (isMCQDone ? 40 : 0);

  const isTopicFullyDone = computedPercent >= 100 || (isVideoDone && isMCQDone);

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-2 animate-in fade-in duration-100">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playTap();
              onBack();
            }}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95 shadow-xs cursor-pointer"
            aria-label="Back to Subject"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Study Unit Preview
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-12">
          <LoadingState variant="inline" message="Loading study unit..." />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => {}} />}

      {!loading && !error && !topic && (
        <EmptyState
          title="Study Unit Not Found"
          description="This study unit does not exist or has been removed."
          actionText="Go Back"
          onAction={onBack}
        />
      )}

      {!loading && !error && topic && (
        <>
          {/* Active Study Unit Information Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                  Active Study Unit
                </span>
              </div>
              {topic.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {topic.badge}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                {topic.title}
              </h1>
              {topic.description && (
                <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-3">
                  {topic.description}
                </p>
              )}
            </div>

            {/* Live Progress Tracker (60% Video + 40% MCQ) */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Lesson Completion</span>
                </div>
                <span className="font-extrabold text-indigo-600">
                  {computedPercent}% {isTopicFullyDone && '🎉 Done'}
                </span>
              </div>

              {/* Progress Track Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isTopicFullyDone
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, computedPercent))}%` }}
                />
              </div>

              {/* Breakdown Pills: 60% Video + 40% MCQ */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
                    isVideoDone
                      ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {isVideoDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">Video Lecture (60%)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${
                    isMCQDone
                      ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {isMCQDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">Practice MCQs (40%)</span>
                </div>
              </div>
            </div>

            {/* Quick Meta Summary Pills */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-100 flex items-center gap-1">
                <Play className="w-3 h-3" /> {lectures.length} {lectures.length === 1 ? 'Lecture' : 'Lectures'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 text-[11px] font-bold border border-sky-100 flex items-center gap-1">
                <FileText className="w-3 h-3" /> {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 flex items-center gap-1">
                <CheckSquare className="w-3 h-3" /> {mcqs.length} MCQs
              </span>
            </div>
          </div>

          {/* Dedicated Launch Cards */}
          <div className="space-y-3 pt-1">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Select Learning Module
            </h2>

            {/* 1. Video Lectures Card */}
            <button
              type="button"
              onClick={() => {
                playTap();
                onOpenLectures();
              }}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-300 active:scale-[0.98] transition-all cursor-pointer text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 fill-white" />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-purple-700 transition-colors">
                      Lectures ({lectures.length})
                    </h3>
                    {isVideoDone && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        60% Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {lectures.length > 0
                      ? 'Watch video classes & expert lessons'
                      : 'No video lessons currently available'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-purple-700 shrink-0">
                <span className="hidden sm:inline">Watch</span>
                <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>

            {/* 2. Study Notes Card */}
            <button
              type="button"
              onClick={() => {
                playTap();
                onOpenNotes();
              }}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-sky-300 active:scale-[0.98] transition-all cursor-pointer text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-sky-700 transition-colors">
                      Notes ({notes.length})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {notes.length > 0
                      ? 'Read summary notes, points & PDF guides'
                      : 'No reading notes currently available'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-sky-700 shrink-0">
                <span className="hidden sm:inline">Read</span>
                <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>

            {/* 3. Practice MCQs Card */}
            <button
              type="button"
              onClick={() => {
                playTap();
                onOpenMCQs();
              }}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 active:scale-[0.98] transition-all cursor-pointer text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                      Practice MCQs ({mcqs.length})
                    </h3>
                    {isMCQDone && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        40% Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {mcqs.length > 0
                      ? 'Objective questions with instant scoring'
                      : 'No practice questions currently available'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                <span className="hidden sm:inline">Practice</span>
                <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
