import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ListVideo,
  SplitSquareVertical,
  LayoutTemplate,
  MonitorPlay,
  BookOpen,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { subscribeToLectureById, subscribeToLecturesByTopic } from '../services/lectures';
import { saveUserProgress, fetchUserProgress } from '../services/progress';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import type { Lecture } from '../types';

interface VideoLecturePageProps {
  lectureId: string;
  onBack: () => void;
  onSelectLecture: (id: string) => void;
}

export const VideoLecturePage: React.FC<VideoLecturePageProps> = ({
  lectureId,
  onBack,
  onSelectLecture,
}) => {
  const { user } = useAuth();
  const { playTap, playSuccess } = useAudio();

  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [topicLectures, setTopicLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // View modes: 'standard' (cinema container), 'half' (docked split view), 'fullscreen'
  const [viewMode, setViewMode] = useState<'standard' | 'half' | 'fullscreen'>('standard');

  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubSiblings = () => {};

    const unsubLecture = subscribeToLectureById(lectureId, (lec) => {
      if (lec) {
        setCurrentLecture(lec);
        if (lec.topicId) {
          unsubSiblings();
          unsubSiblings = subscribeToLecturesByTopic(lec.topicId, (siblings) => {
            setTopicLectures(siblings || []);
          });
        }
      } else {
        setCurrentLecture(null);
      }
      setLoading(false);
    });

    if (user) {
      fetchUserProgress(user.uid).then((progressList) => {
        const found = progressList.find((p) => p.lectureId === lectureId);
        if (found) {
          setProgress(found.progress);
          setIsCompleted(found.completed || found.progress >= 80);
        } else {
          setProgress(0);
          setIsCompleted(false);
        }
      });
    }

    return () => {
      unsubLecture();
      unsubSiblings();
    };
  }, [lectureId, user]);

  const handleProgressUpdate = useCallback(
    async (percent: number) => {
      setProgress((prev) => {
        const rounded = Math.min(100, Math.max(prev, Math.round(percent)));
        return rounded;
      });

      if (currentLecture && user && percent > 0) {
        if (percent >= 80 && !isCompleted) {
          setIsCompleted(true);
          playSuccess();
          await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, 100, true);
        } else {
          await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, Math.round(percent), false);
        }
      }
    },
    [currentLecture, user, isCompleted, playSuccess]
  );

  const handleVideoEnded = useCallback(async () => {
    if (currentLecture && user) {
      setIsCompleted(true);
      setProgress(100);
      playSuccess();
      await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, 100, true);
    }
  }, [currentLecture, user, playSuccess]);

  const handleMarkCompleteManually = async () => {
    if (currentLecture && user) {
      setIsCompleted(true);
      setProgress(100);
      playSuccess();
      await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, 100, true);
    }
  };

  const currentIndex = topicLectures.findIndex((l) => l.id === lectureId);
  const prevLecture = currentIndex > 0 ? topicLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < topicLectures.length - 1 ? topicLectures[currentIndex + 1] : null;

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 transition-all duration-300 ${
        viewMode === 'half'
          ? 'max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-24'
          : 'max-w-4xl mx-auto px-3 sm:px-6 pt-2 pb-24 space-y-4'
      }`}
    >
      {/* Top Classroom Header Navigation */}
      <div className="flex items-center justify-between gap-3 py-3 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playTap();
              onBack();
            }}
            className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors active:scale-95 border border-slate-700 shadow-md cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block">
              Edu Veda Classroom
            </span>
            {currentLecture ? (
              <span className="text-sm font-bold text-white line-clamp-1 max-w-[220px] sm:max-w-md">
                {currentLecture.title}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Loading lecture...</span>
            )}
          </div>
        </div>

        {/* View Mode Options */}
        {currentLecture && (
          <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-medium gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                playTap();
                setViewMode('standard');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'standard'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cinema 16:9 View"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Cinema</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                setViewMode('half');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'half'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Split Half Screen View"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Split Screen</span>
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-20">
          <LoadingState variant="inline" message="Opening dedicated classroom player..." />
        </div>
      )}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            setError(null);
          }}
        />
      )}

      {!loading && !error && !currentLecture && (
        <EmptyState
          title="Lecture Not Found"
          description="This lecture does not exist or has been removed."
          actionText="Return to Lessons"
          onAction={onBack}
        />
      )}

      {!loading && !error && currentLecture && (
        <div
          className={
            viewMode === 'half'
              ? 'flex flex-col lg:grid lg:grid-cols-12 gap-5 items-start'
              : 'space-y-4'
          }
        >
          {/* Main Video Cinema Container */}
          <div
            className={
              viewMode === 'half'
                ? 'w-full lg:col-span-7 sticky top-3 z-30'
                : 'w-full'
            }
          >
            <VideoPlayer
              src={currentLecture.storagePath || currentLecture.videoUrl || ''}
              title={currentLecture.title}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              onProgressUpdate={handleProgressUpdate}
              onEnded={handleVideoEnded}
              onBack={onBack}
            />

            {viewMode === 'half' && (
              <div className="mt-2.5 flex items-center justify-between px-2 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  Split Screen Active
                </span>
                <span>Scroll below to view study notes</span>
              </div>
            )}
          </div>

          {/* Details, Playlist & Study Notes Container */}
          <div
            className={`space-y-4 ${
              viewMode === 'half'
                ? 'w-full lg:col-span-5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1'
                : ''
            }`}
          >
            {/* Lecture Meta & Progress Card */}
            <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider bg-indigo-950/80 border border-indigo-800/50 px-2.5 py-0.5 rounded-full inline-block">
                      Lesson {currentIndex >= 0 ? currentIndex + 1 : 1} of {topicLectures.length || 1}
                    </span>
                    {currentLecture.instructorName && (
                      <span className="text-[11px] text-slate-300 font-medium">
                        by <strong className="text-white">{currentLecture.instructorName}</strong>
                      </span>
                    )}
                  </div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    {currentLecture.title}
                  </h1>
                </div>

                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-800/60 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkCompleteManually}
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 bg-indigo-950 hover:bg-indigo-900 px-3.5 py-1.5 rounded-full border border-indigo-700/60 shrink-0 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span>{progress > 0 ? `${progress}% · Mark Done` : 'Mark Done'}</span>
                  </button>
                )}
              </div>

              {currentLecture.description && (
                <div className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  <p>{currentLecture.description}</p>
                </div>
              )}

              {/* Next / Previous Lecture Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  disabled={!prevLecture}
                  onClick={() => {
                    if (prevLecture) {
                      playTap();
                      onSelectLecture(prevLecture.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer border border-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={!nextLecture}
                  onClick={() => {
                    if (nextLecture) {
                      playTap();
                      onSelectLecture(nextLecture.id);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Playlist / Other Lectures in Topic */}
            {topicLectures.length > 1 && (
              <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <ListVideo className="w-4 h-4 text-indigo-400" />
                  <span>Topic Playlist ({topicLectures.length} Lessons)</span>
                </div>

                <div className="space-y-2">
                  {topicLectures.map((lec, idx) => {
                    const isCurrent = lec.id === currentLecture.id;
                    return (
                      <button
                        key={lec.id}
                        type="button"
                        onClick={() => {
                          if (!isCurrent) {
                            playTap();
                            onSelectLecture(lec.id);
                          }
                        }}
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-950/80 border-indigo-700/80 font-bold text-white shadow-md'
                            : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              isCurrent
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">{lec.title}</span>
                        </div>

                        {isCurrent && (
                          <span className="text-[10px] text-indigo-300 font-bold px-2 py-0.5 rounded-full bg-indigo-900/80 border border-indigo-700/50 shrink-0">
                            Playing
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
