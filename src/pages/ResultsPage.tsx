import React, { useEffect, useState } from 'react';
import { Award, Timer, CheckCircle2, XCircle, BarChart3, ArrowLeft, RefreshCw, Calendar, ChevronRight } from 'lucide-react';
import type { MockAttempt, MCQAttempt } from '../types';
import { subscribeToUserMockAttempts, subscribeToUserMCQAttempts } from '../services/attempts';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

interface ResultsPageProps {
  onBack?: () => void;
  onNavigateToTests?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  onBack,
  onNavigateToTests,
}) => {
  const { user } = useAuth();
  const { playTap } = useAudio();

  const [activeTab, setActiveTab] = useState<'mock' | 'mcq'>('mock');
  const [mockAttempts, setMockAttempts] = useState<MockAttempt[]>([]);
  const [mcqAttempts, setMcqAttempts] = useState<MCQAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubMocks = subscribeToUserMockAttempts(user.uid, mocks => {
      setMockAttempts(mocks || []);
      setLoading(false);
    });

    const unsubMcqs = subscribeToUserMCQAttempts(user.uid, mcqs => {
      setMcqAttempts(mcqs || []);
    });

    return () => {
      unsubMocks();
      unsubMcqs();
    };
  }, [user]);

  // Compute analytics
  const totalMockTests = mockAttempts.length;
  const avgAccuracy =
    totalMockTests > 0
      ? Math.round(
          mockAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / totalMockTests
        )
      : 0;
  const highestScore =
    totalMockTests > 0
      ? Math.max(...mockAttempts.map(m => m.score || 0))
      : 0;

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
                onBack();
              }}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Test Performance & Results
            </h1>
            <p className="text-xs text-slate-500">
              Exam history, marks, and scoring accuracy
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-center">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            Attempted
          </span>
          <p className="text-lg font-extrabold text-indigo-950 mt-0.5">
            {totalMockTests}
          </p>
          <span className="text-[10px] text-indigo-500 font-medium">Tests</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-center">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Avg Score
          </span>
          <p className="text-lg font-extrabold text-emerald-950 mt-0.5">
            {avgAccuracy}%
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Accuracy</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100 text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Peak Score
          </span>
          <p className="text-lg font-extrabold text-amber-950 mt-0.5">
            {highestScore}
          </p>
          <span className="text-[10px] text-amber-600 font-medium">Points</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            playTap();
            setActiveTab('mock');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'mock'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Mock Exams ({mockAttempts.length})
        </button>
        <button
          type="button"
          onClick={() => {
            playTap();
            setActiveTab('mcq');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'mcq'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Topic Quizzes ({mcqAttempts.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading your results..." />
      ) : activeTab === 'mock' ? (
        mockAttempts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <EmptyState
              icon={Award}
              title="No Mock Tests Attempted"
              description="Take a live mock test to test your speed and evaluate your rank."
            />
            {onNavigateToTests && (
              <button
                type="button"
                onClick={() => {
                  playTap();
                  onNavigateToTests();
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <span>Browse Mock Tests</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mockAttempts.map(attempt => (
              <div
                key={attempt.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {attempt.mockTitle || 'Mock Test Examination'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {attempt.createdAt
                          ? new Date(attempt.createdAt).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                      {attempt.timeTaken && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Timer className="w-3 h-3" />
                            <span>{Math.round(attempt.timeTaken / 60)} mins</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-indigo-600">
                      {attempt.score}/{attempt.total}
                    </span>
                    <span className="block text-[10px] font-bold text-emerald-600">
                      {attempt.percentage}% Accuracy
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-center text-xs">
                  <div className="text-emerald-700 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{attempt.correct} Correct</span>
                  </div>
                  <div className="text-rose-700 font-semibold flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>{attempt.wrong} Wrong</span>
                  </div>
                  <div className="text-slate-500 font-semibold">
                    <span>{attempt.skipped || 0} Skipped</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : mcqAttempts.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Topic Quizzes Attempted"
          description="Practice lesson MCQs from the syllabus or MCQ Practice tab to see your records."
        />
      ) : (
        <div className="space-y-3">
          {mcqAttempts.map(att => (
            <div
              key={att.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                  {att.topicTitle || 'Topic Practice Quiz'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {new Date(att.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-indigo-600">
                  {att.score}/{att.total}
                </span>
                <span className="block text-[10px] font-semibold text-slate-500">
                  {Math.round((att.score / Math.max(1, att.total)) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
