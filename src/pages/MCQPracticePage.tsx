import React, { useEffect, useState } from 'react';
import { HelpCircle, RefreshCw, CheckCircle2, XCircle, ArrowLeft, Filter, Sparkles } from 'lucide-react';
import type { MCQ } from '../types';
import { subscribeToAllPublishedMCQs } from '../services/mcqs';
import { DynamicMCQ } from '../components/dynamic';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { saveMCQAttempt } from '../services/attempts';

interface MCQPracticePageProps {
  onBack?: () => void;
  topicId?: string;
  topicTitle?: string;
}

export const MCQPracticePage: React.FC<MCQPracticePageProps> = ({
  onBack,
  topicId,
  topicTitle,
}) => {
  const { playTap, playSuccess } = useAudio();
  const { user } = useAuth();

  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    const unsub = subscribeToAllPublishedMCQs(data => {
      let filtered = data;
      if (topicId) {
        filtered = data.filter(m => m.topicId === topicId || m.chapter === topicId);
      }
      setMcqs(filtered);
      setLoading(false);
    });
    return () => unsub();
  }, [topicId]);

  const filteredMcqs = mcqs.filter(m => {
    if (difficultyFilter === 'all') return true;
    return m.difficulty === difficultyFilter;
  });

  const handleSelect = (mcqId: string, optionIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [mcqId]: optionIdx,
    }));
  };

  const handleReset = () => {
    playTap();
    setSelectedAnswers({});
  };

  // Calculate score stats
  let correctCount = 0;
  let answeredCount = 0;

  filteredMcqs.forEach(m => {
    if (selectedAnswers[m.id] !== undefined) {
      answeredCount++;
      if (selectedAnswers[m.id] === m.correctAnswer) {
        correctCount++;
      }
    }
  });

  const handleSaveAttempt = async () => {
    if (!user || answeredCount === 0) return;
    playSuccess();
    try {
      await saveMCQAttempt({
        uid: user.uid,
        topicId: topicId || 'general-practice',
        topicTitle: topicTitle || 'General MCQ Practice',
        score: correctCount,
        total: answeredCount,
        correct: correctCount,
        wrong: answeredCount - correctCount,
        answers: selectedAnswers,
      });
    } catch {}
  };

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
              {topicTitle ? `${topicTitle} MCQs` : 'MCQ Practice'}
            </h1>
            <p className="text-xs text-slate-500">
              Interactive question bank with answers & explanations
            </p>
          </div>
        </div>

        {answeredCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 p-1.5"
            title="Reset answers"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Score Summary Sticky Bar */}
      {answeredCount > 0 && (
        <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700">Solved</span>
              <p className="text-sm font-extrabold text-indigo-950">
                {answeredCount}/{filteredMcqs.length}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700">Correct</span>
              <p className="text-sm font-extrabold text-emerald-700">
                {correctCount}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700">Wrong</span>
              <p className="text-sm font-extrabold text-rose-700">
                {answeredCount - correctCount}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-indigo-600">Accuracy</span>
            <p className="text-sm font-extrabold text-indigo-900">
              {Math.round((correctCount / answeredCount) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Difficulty Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
          <button
            key={diff}
            type="button"
            onClick={() => {
              playTap();
              setDifficultyFilter(diff);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all active:scale-95 ${
              difficultyFilter === diff
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {diff === 'all' ? 'All Difficulties' : diff}
          </button>
        ))}
      </div>

      {/* Questions list */}
      {loading ? (
        <LoadingState message="Loading MCQs from Firestore..." />
      ) : filteredMcqs.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No MCQs Available"
          description="Multiple choice questions created by Admin in the Admin Web will automatically appear here."
        />
      ) : (
        <div className="space-y-4">
          {filteredMcqs.map((mcq, idx) => (
            <DynamicMCQ
              key={mcq.id}
              mcq={mcq}
              index={idx}
              selectedAnswer={selectedAnswers[mcq.id] ?? null}
              onSelectAnswer={ansIdx => handleSelect(mcq.id, ansIdx)}
              showFeedback={selectedAnswers[mcq.id] !== undefined}
            />
          ))}

          {answeredCount >= 3 && user && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveAttempt}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Save Practice Progress
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
