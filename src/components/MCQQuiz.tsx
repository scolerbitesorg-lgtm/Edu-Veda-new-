import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BarChart3,
  Award,
  Bookmark,
  SkipForward,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { saveMCQAttempt } from '../services/attempts';
import { isQuestionBookmarked, toggleBookmarkQuestion } from '../services/bookmarks';
import type { MCQ } from '../types';

interface MCQQuizProps {
  mcqs: MCQ[];
  topicTitle: string;
  topicId: string;
  onFinish?: () => void;
}

export const MCQQuiz: React.FC<MCQQuizProps> = ({
  mcqs,
  topicTitle,
  topicId,
  onFinish,
}) => {
  const { user } = useAuth();
  const { playTap, playSuccess, playWrong, playComplete } = useAudio();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const currentMCQ = mcqs[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const currentSelected = selectedAnswers[currentIndex];
  const isCorrect = currentSelected === currentMCQ?.correctAnswer;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return; // Prevent re-selection once answered
    playTap();

    const updated = { ...selectedAnswers, [currentIndex]: index };
    setSelectedAnswers(updated);

    if (index === currentMCQ.correctAnswer) {
      playSuccess();
    } else {
      playWrong();
    }
  };

  const finishQuiz = async (answers: Record<number, number>) => {
    let correct = 0;
    let wrong = 0;
    mcqs.forEach((m, idx) => {
      const ans = answers[idx];
      if (ans !== undefined) {
        if (ans === m.correctAnswer) correct++;
        else wrong++;
      }
    });

    setIsCompleted(true);
    playComplete();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

    if (user) {
      setIsSaving(true);
      try {
        await saveMCQAttempt({
          uid: user.uid,
          topicId,
          topicTitle,
          score: correct,
          total: mcqs.length,
          correct,
          wrong,
          answers,
        });
      } catch (e) {
        console.error('Failed to save MCQ attempt:', e);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNext = () => {
    playTap();
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz(selectedAnswers);
    }
  };

  const handleSkip = () => {
    playTap();
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz(selectedAnswers);
    }
  };

  const handleRestart = () => {
    playTap();
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setShowAnalysis(false);
  };

  if (!mcqs || mcqs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm">
        <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">No MCQs available yet</h4>
        <p className="text-xs text-slate-400 mt-1">Questions will be added soon.</p>
      </div>
    );
  }

  // Completed Summary Screen
  if (isCompleted) {
    let correctCount = 0;
    let wrongCount = 0;
    mcqs.forEach((m, idx) => {
      const ans = selectedAnswers[idx];
      if (ans !== undefined) {
        if (ans === m.correctAnswer) correctCount++;
        else wrongCount++;
      }
    });

    const attemptedCount = Object.keys(selectedAnswers).length;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const scorePercent = Math.round((correctCount / mcqs.length) * 100);

    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Quiz Completed!</h3>
          <p className="text-xs text-slate-500 mt-0.5">{topicTitle}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/60 text-center">
            <span className="text-[10px] font-semibold text-indigo-700 block">Total</span>
            <span className="text-lg font-bold text-indigo-900">{mcqs.length}</span>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100/60 text-center">
            <span className="text-[10px] font-semibold text-purple-700 block">Attempted</span>
            <span className="text-lg font-bold text-purple-900">{attemptedCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-center">
            <span className="text-[10px] font-semibold text-slate-600 block">Skipped</span>
            <span className="text-lg font-bold text-slate-800">{mcqs.length - attemptedCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/60 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 block">Correct Answers</span>
            <span className="text-xl font-bold text-emerald-900">{correctCount}</span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100/60 text-center">
            <span className="text-[11px] font-semibold text-rose-700 block">Wrong Answers</span>
            <span className="text-xl font-bold text-rose-900">{wrongCount}</span>
          </div>
        </div>

        {/* Score & Accuracy Bars */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-5 space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Score ({correctCount}/{mcqs.length})</span>
              <span className="text-indigo-600 font-bold">{scorePercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Accuracy</span>
              <span className="text-emerald-600 font-bold">{accuracy}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{showAnalysis ? 'Hide Detailed Analysis' : 'View Question-wise Analysis'}</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestart}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
            {onFinish && (
              <button
                type="button"
                onClick={onFinish}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Question-wise Detailed Analysis */}
        {showAnalysis && (
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Question Analysis
            </h4>
            {mcqs.map((q, qIndex) => {
              const userAns = selectedAnswers[qIndex];
              const isAnsCorrect = userAns === q.correctAnswer;
              return (
                <div
                  key={q.id || qIndex}
                  className={`p-3.5 rounded-2xl border text-xs ${
                    userAns === undefined
                      ? 'bg-slate-50 border-slate-200'
                      : isAnsCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-800">
                      Q{qIndex + 1}. {q.question}
                    </span>
                    {userAns !== undefined ? (
                      isAnsCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                        Skipped
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-2">
                    {q.options.map((opt, optIndex) => {
                      const isCorrectOpt = optIndex === q.correctAnswer;
                      const isSelectedOpt = optIndex === userAns;
                      return (
                        <div
                          key={optIndex}
                          className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] ${
                            isCorrectOpt
                              ? 'bg-emerald-100 text-emerald-900 font-semibold'
                              : isSelectedOpt
                              ? 'bg-rose-100 text-rose-900 font-medium'
                              : 'text-slate-600'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + optIndex)}. {opt}</span>
                          {isCorrectOpt && <span className="text-[10px] text-emerald-700">Correct</span>}
                          {isSelectedOpt && !isCorrectOpt && <span className="text-[10px] text-rose-700">Your choice</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-700">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Active Question Card
  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
      {/* Progress & Question Counter */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-medium">
        <span className="font-bold text-indigo-600">
          Question {currentIndex + 1} of {mcqs.length}
        </span>
        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={() => {
                playTap();
                toggleBookmarkQuestion(user.uid, currentMCQ);
              }}
              className={`p-1 rounded-lg transition-colors ${
                isQuestionBookmarked(user.uid, currentMCQ.id)
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title="Bookmark Question"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isQuestionBookmarked(user.uid, currentMCQ.id) ? 'fill-current' : ''
                }`}
              />
            </button>
          )}
          <span>
            {Math.round(((currentIndex + 1) / mcqs.length) * 100)}%
          </span>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
        />
      </div>

      {/* Question Text */}
      <div className="mb-5">
        <h3 className="font-bold text-slate-900 text-base leading-relaxed tracking-tight">
          {currentMCQ.question}
        </h3>
      </div>

      {/* Options List */}
      <div className="space-y-2.5 mb-5">
        {currentMCQ.options.map((option, optIdx) => {
          const isSelected = currentSelected === optIdx;
          const isCorrectChoice = optIdx === currentMCQ.correctAnswer;

          let btnClass = 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-slate-50/50';
          let letterClass = 'bg-slate-100 text-slate-700';

          if (isAnswered) {
            if (isCorrectChoice) {
              btnClass = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-sm';
              letterClass = 'bg-emerald-600 text-white';
            } else if (isSelected) {
              btnClass = 'bg-rose-50 border-rose-300 text-rose-950 font-medium shadow-sm';
              letterClass = 'bg-rose-500 text-white';
            } else {
              btnClass = 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60';
              letterClass = 'bg-slate-200 text-slate-500';
            }
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(optIdx)}
              className={`w-full min-h-[50px] p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all duration-150 active:scale-[0.99] ${btnClass}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${letterClass}`}
              >
                {optionLetters[optIdx] || optIdx + 1}
              </div>

              <span className="flex-1 text-sm tracking-tight leading-snug">
                {option}
              </span>

              {isAnswered && isCorrectChoice && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              {isAnswered && isSelected && !isCorrectChoice && (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation Box */}
      {isAnswered && (
        <div
          className={`p-4 rounded-2xl mb-5 text-xs leading-relaxed border animate-in fade-in duration-200 ${
            isCorrect
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/60 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}</span>
          </div>
          {currentMCQ.explanation ? (
            <p className="mt-1 text-slate-700">{currentMCQ.explanation}</p>
          ) : (
            <p className="mt-1 text-slate-600">
              The correct answer is Option {optionLetters[currentMCQ.correctAnswer]}.
            </p>
          )}
        </div>
      )}

      {/* Action Buttons: Skip Question or Next Question */}
      {!isAnswered ? (
        <button
          type="button"
          onClick={handleSkip}
          className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-slate-200 active:scale-[0.98] transition-all"
        >
          <SkipForward className="w-4 h-4 text-slate-500" />
          <span>Skip Question</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all"
        >
          <span>{currentIndex < mcqs.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
