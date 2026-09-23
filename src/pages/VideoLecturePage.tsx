import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ListVideo,
  Maximize2,
  Smartphone,
  SplitSquareVertical,
  LayoutTemplate,
  MonitorPlay,
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

  // View modes: 'standard' (16:9 card), 'half' (docked 50% split / side-by-side), 'fullscreen'
  const [viewMode, setViewMode] = useState<'standard' | 'half' | 'fullscreen'>('standard');

  useEffect(() => {
    setLoading(true);
    setError(null);
    let unsubSiblings = () => {};

    const unsubLecture = subscribeToLectureById(lectureId, lec => {
      if (lec) {
        setCurrentLecture(lec);
        if (lec.topicId) {
          unsubSiblings();
          unsubSiblings = subscribeToLecturesByTopic(lec.topicId, siblings => {
            setTopicLectures(siblings || []);
          });
        }
      } else {
        setCurrentLecture(null);
      }
      setLoading(false);
    });

    if (user) {
      fetchUserProgress(user.uid).then(progressList => {
        const found = progressList.find(p => p.lectureId === lectureId);
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

  const handleProgressUpdate = async (percent: number) => {
    const rounded = Math.min(100, Math.max(progress, Math.round(percent)));
    setProgress(rounded);
    if ((rounded >= 80 || percent >= 80) && !isCompleted && currentLecture && user) {
      setIsCompleted(true);
      playSuccess();
      await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, 100, true);
    } else if (currentLecture && user && rounded > 0) {
      await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, rounded, false);
    }
  };

  const handleVideoEnded = async () => {
    if (currentLecture && user) {
      setIsCompleted(true);
      setProgress(100);
      playSuccess();
      await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, 100, true);
    }
  };

  const handleMarkCompleteManually = async () => {
    if (currentLecture && user) {
      setIsCompleted(true);
      setProgress(100);
      playSuccess();
      await saveUserProgress(user.uid, currentLecture.topicId, currentLecture.id, 100, true);
    }
  };

  const currentIndex = topicLectures.findIndex(l => l.id === lectureId);
  const prevLecture = currentIndex > 0 ? topicLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < topicLectures.length - 1 ? topicLectures[currentIndex + 1] : null;

  return (
    <div
      className={`transition-all duration-300 ${
        viewMode === 'half'
          ? 'max-w-5xl mx-auto px-3 sm:px-4 pt-1 pb-24'
          : 'max-w-md mx-auto px-4 pt-2 pb-24 space-y-4'
      }`}
    >
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-2 mb-3">
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
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Classroom Lecture
            </span>
            {currentLecture && (
              <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                {currentLecture.title}
              </span>
            )}
          </div>
        </div>

        {/* View Mode Switcher Pill */}
        {currentLecture && (
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/40 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                playTap();
                setViewMode('standard');
              }}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'standard'
                  ? 'bg-white text-indigo-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Standard 16:9 View"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Standard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playTap();
                setViewMode('half');
              }}
              className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                viewMode === 'half'
                  ? 'bg-white text-indigo-600 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Side / Half Screen Split View"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Half Screen</span>
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12">
          <LoadingState variant="inline" message="Loading video stream..." />
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
          actionText="Go Back"
          onAction={onBack}
        />
      )}

      {!loading && !error && currentLecture && (
        <div
          className={
            viewMode === 'half'
              ? 'flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start'
              : 'space-y-4'
          }
        >
          {/* Video Player Box */}
          <div
            className={`transition-all duration-300 ease-out ${
              viewMode === 'half'
                ? 'w-full lg:col-span-7 sticky top-2 z-30'
                : 'w-full rounded-2xl overflow-hidden shadow-lg border border-slate-900 bg-black'
            }`}
            style={{
              contain: 'layout paint',
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)',
            }}
          >
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-900 bg-black">
              <VideoPlayer
                src={currentLecture.storagePath || currentLecture.videoUrl || ''}
                title={currentLecture.title}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
                onProgressUpdate={handleProgressUpdate}
                onEnded={handleVideoEnded}
              />
            </div>

            {/* Quick mode indicators in half screen mode */}
            {viewMode === 'half' && (
              <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                  <MonitorPlay className="w-3.5 h-3.5" />
                  Smooth Half Screen Player
                </span>
                <span>Scroll below to view notes & lessons</span>
              </div>
            )}
          </div>

          {/* Scrollable Content Container (Details, Notes, Playlist) */}
          <div
            className={`space-y-4 ${
              viewMode === 'half'
                ? 'w-full lg:col-span-5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1'
                : ''
            }`}
          >
            {/* Lecture Meta & Progress Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full inline-block mb-1">
                    Lesson {currentIndex >= 0 ? currentIndex + 1 : 1} of {topicLectures.length || 1}
                  </span>
                  <h1 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                    {currentLecture.title}
                  </h1>
                  {currentLecture.instructorName && (
                    <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                      Instructor: {currentLecture.instructorName}
                    </p>
                  )}
                </div>

                {isCompleted ? (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>100% Watched</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkCompleteManually}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200 shrink-0 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{progress > 0 ? `${progress}% · Mark Done` : 'Mark Done'}</span>
                  </button>
                )}
              </div>

              {currentLecture.description && (
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2.5">
                  {currentLecture.description}
                </p>
              )}

              {/* Next / Previous Lecture Action Bar */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={!prevLecture}
                  onClick={() => {
                    if (prevLecture) {
                      playTap();
                      onSelectLecture(prevLecture.id);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
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
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:pointer-events-none shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Playlist / Other Lectures in Topic */}
            {topicLectures.length > 1 && (
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <ListVideo className="w-4 h-4 text-indigo-600" />
                  <span>More in this Topic ({topicLectures.length})</span>
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
                        className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition-all ${
                          isCurrent
                            ? 'bg-indigo-50/80 border-indigo-200 font-bold text-indigo-900 shadow-xs'
                            : 'bg-white border-slate-100 hover:border-indigo-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">{lec.title}</span>
                        </div>

                        {isCurrent && (
                          <span className="text-[10px] text-indigo-600 font-bold px-2 py-0.5 rounded-full bg-indigo-100 shrink-0">
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
