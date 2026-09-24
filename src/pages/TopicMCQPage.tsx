import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Bookmark,
  Award,
  Grid,
  ListFilter,
  Check,
  Loader2,
} from 'lucide-react';
import { subscribeToMCQsByTopic } from '../services/mcqs';
import { subscribeToTopicById } from '../services/topics';
import { saveMCQAttempt } from '../services/attempts';
import { saveTopicMCQCompletion } from '../services/progress';
import { isQuestionBookmarked, toggleBookmarkQuestion } from '../services/bookmarks';
import { getMCQExplanation } from '../services/ai';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import type { MCQ, Topic } from '../types';

interface TopicMCQPageProps {
  topicId: string;
  onBack: () => void;
}

export const TopicMCQPage: React.FC<TopicMCQPageProps> = ({ topicId, onBack }) => {
  const { user } = useAuth();
  const { playTap, playSuccess, playWrong, playComplete } = useAudio();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Quiz State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState<boolean>(false);
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
  const [loadingAiExp, setLoadingAiExp] = useState<Record<number, boolean>>({});

  const handleFetchAiExplanation = async (qIdx: number) => {
    const q = mcqs[qIdx];
    if (!q || aiExplanations[qIdx]) return;
    playTap();
    setLoadingAiExp(prev => ({ ...prev, [qIdx]: true }));
    try {
      const exp = await getMCQExplanation({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: selectedAnswers[qIdx],
        topic: topic?.title,
      });
      setAiExplanations(prev => ({ ...prev, [qIdx]: exp }));
    } catch {
      setAiExplanations(prev => ({
        ...prev,
        [qIdx]: 'Concept summary: Please review the core principles and textbook notes for this topic.',
      }));
    } finally {
      setLoadingAiExp(prev => ({ ...prev, [qIdx]: false }));
    }
  };

  // Subscribe to Topic details and MCQs
  useEffect(() => {
    setLoading(true);
    const unsubTopic = subscribeToTopicById(topicId, t => {
      setTopic(t);
    });

    const unsubMCQs = subscribeToMCQsByTopic(topicId, m => {
      setMCQs(m || []);
      setLoading(false);
    });

    return () => {
      unsubTopic();
      unsubMCQs();
    };
  }, [topicId]);

  const currentMCQ = mcqs[currentIndex];
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const currentSelected = selectedAnswers[currentIndex];
  const isCorrect = currentSelected === currentMCQ?.correctAnswer;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return; // Freeze once selected
    playTap();

    const updated = { ...selectedAnswers, [currentIndex]: index };
    setSelectedAnswers(updated);

    if (index === currentMCQ.correctAnswer) {
      playSuccess();
    } else {
      playWrong();
    }
  };

  const handleNext = () => {
    playTap();
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish(selectedAnswers);
    }
  };

  const handlePrevious = () => {
    playTap();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    playTap();
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish(selectedAnswers);
    }
  };

  const handleFinish = async (answers: Record<number, number>) => {
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
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    if (user && topic) {
      try {
        await Promise.all([
          saveMCQAttempt({
            uid: user.uid,
            topicId: topic.id,
            topicTitle: topic.title,
            score: correct,
            total: mcqs.length,
            correct,
            wrong,
            answers,
          }),
          saveTopicMCQCompletion(user.uid, topic.id),
        ]);
      } catch (e) {
        console.error('Failed to save MCQ attempt & progress:', e);
      }
    }
  };

  const handleRestart = () => {
    playTap();
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setShowAnalysis(false);
    setShowQuestionPalette(false);
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8F9FD] flex items-center justify-center">
        <LoadingState variant="full" message="Loading practice questions..." />
      </div>
    );
  }

  if (mcqs.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8F9FD] flex flex-col justify-between p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 shadow-xs"
            aria-label="Back to Lesson"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-800 text-sm">
            {topic?.title || 'Practice MCQs'}
          </span>
        </div>

        <div className="max-w-sm mx-auto my-auto w-full">
          <EmptyState
            title="No MCQs Available"
            description="Questions for this lesson will be added soon by educators."
            actionText="Back to Lesson"
            onAction={onBack}
            icon={HelpCircle}
          />
        </div>
      </div>
    );
  }

  // Result / Summary Screen
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
    const skippedCount = mcqs.length - attemptedCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const scorePercent = Math.round((correctCount / mcqs.length) * 100);

    return (
      <div className="fixed inset-0 z-50 bg-[#F8F9FD] overflow-y-auto flex flex-col select-none">
        {/* Top Header */}
        <header className="bg-white px-4 py-3 border-b border-slate-200/80 sticky top-0 z-10 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95"
              aria-label="Back to Study Unit"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 tracking-tight">Quiz Results</h2>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                {topic?.title || 'Practice MCQs'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake</span>
          </button>
        </header>

        {/* Content Container */}
        <div className="flex-1 max-w-md mx-auto w-full p-4 space-y-4 pb-12">
          {/* Score Hero Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-indigo-500/20">
              <Award className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider px-2.5 py-1 bg-indigo-50 rounded-full">
              Quiz Completed
            </span>

            <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-2 mb-1">
              {correctCount} / {mcqs.length}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {scorePercent >= 80
                ? 'Outstanding performance! Topic mastered.'
                : scorePercent >= 50
                ? 'Good effort! Review missed questions to improve.'
                : 'Keep practicing to master this lesson.'}
            </p>

            {/* Performance Stats Row */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-left">
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Correct</p>
                <p className="text-base font-black text-emerald-950">{correctCount}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                <p className="text-[10px] font-bold text-rose-700 uppercase">Incorrect</p>
                <p className="text-base font-black text-rose-950">{wrongCount}</p>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase">Accuracy</p>
                <p className="text-base font-black text-amber-950">{accuracy}%</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowAnalysis(prev => !prev)}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all border border-indigo-100 flex items-center justify-center gap-1.5"
            >
              <ListFilter className="w-4 h-4" />
              <span>{showAnalysis ? 'Hide Analysis' : 'Review Answers & Explanations'}</span>
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5"
            >
              <span>Back to Lesson</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Question-wise Detailed Analysis */}
          {showAnalysis && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider px-1">
                Detailed Solutions
              </h4>
              {mcqs.map((q, qIndex) => {
                const userAns = selectedAnswers[qIndex];
                const isAnsCorrect = userAns === q.correctAnswer;
                return (
                  <div
                    key={q.id || qIndex}
                    className={`p-4 rounded-2xl border text-xs bg-white shadow-xs ${
                      userAns === undefined
                        ? 'border-slate-200'
                        : isAnsCorrect
                        ? 'border-emerald-200'
                        : 'border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm leading-snug">
                        Q{qIndex + 1}. {q.question}
                      </span>
                      {userAns !== undefined ? (
                        isAnsCorrect ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] shrink-0 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Wrong
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] shrink-0">
                          Skipped
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 my-2.5">
                      {q.options.map((opt, optIndex) => {
                        const isCorrectOpt = optIndex === q.correctAnswer;
                        const isSelectedOpt = optIndex === userAns;
                        return (
                          <div
                            key={optIndex}
                            className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-medium border ${
                              isCorrectOpt
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : isSelectedOpt
                                ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                : 'bg-slate-50 border-slate-100 text-slate-700'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIndex)}. {opt}
                            </span>
                            {isCorrectOpt && (
                              <span className="text-[10px] font-bold text-emerald-700">
                                Correct Answer
                              </span>
                            )}
                            {isSelectedOpt && !isCorrectOpt && (
                              <span className="text-[10px] font-bold text-rose-700">
                                Your Choice
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl">
                        <span className="font-bold text-slate-800">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active MCQ Question Experience
  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FD] flex flex-col h-[100dvh] w-full overflow-hidden select-none">
      {/* 1. Dedicated Top Header */}
      <header className="bg-white px-4 py-3 border-b border-slate-200/80 shadow-2xs shrink-0 z-10">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto w-full">
          {/* Back button */}
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
            aria-label="Back to Study Unit"
            title="Back to Study Unit"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Topic Title */}
          <div className="min-w-0 flex-1 text-center">
            <h2 className="font-extrabold text-sm text-slate-900 tracking-tight truncate">
              {topic?.title || 'Practice MCQs'}
            </h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Objective Practice
            </p>
          </div>

          {/* Question Palette & Counter Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQuestionPalette(prev => !prev)}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                showQuestionPalette
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
              title="Question Navigator"
            >
              <Grid className="w-4 h-4" />
              <span className="text-xs">
                {currentIndex + 1}/{mcqs.length}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2.5 max-w-md mx-auto">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Question Grid Quick Jump Drawer (if toggled) */}
      {showQuestionPalette && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-150 shrink-0 z-20">
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Navigator
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Answered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> Pending
                </span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {mcqs.map((_, idx) => {
                const isCur = idx === currentIndex;
                const isAns = selectedAnswers[idx] !== undefined;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      playTap();
                      setCurrentIndex(idx);
                      setShowQuestionPalette(false);
                    }}
                    className={`w-8 h-8 rounded-xl font-bold text-xs shrink-0 flex items-center justify-center transition-all ${
                      isCur
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                        : isAns
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Scrollable Middle Area: Question & Options */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto w-full space-y-4 select-text">
        {/* Question Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          {/* Question Meta Label */}
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-500">
            <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase">
              Question {currentIndex + 1} of {mcqs.length}
            </span>

            {user && (
              <button
                type="button"
                onClick={() => {
                  playTap();
                  toggleBookmarkQuestion(user.uid, currentMCQ);
                }}
                className={`p-1.5 rounded-xl transition-colors ${
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
          </div>

          {/* Question Text */}
          <h3 className="font-extrabold text-slate-900 text-base leading-relaxed tracking-tight mb-4">
            {currentMCQ.question}
          </h3>

          {/* Options */}
          <div className="space-y-2.5">
            {currentMCQ.options.map((option, optIdx) => {
              const isSelected = currentSelected === optIdx;
              const isCorrectChoice = optIdx === currentMCQ.correctAnswer;

              let btnClass =
                'bg-slate-50/80 border-slate-200 text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/30';
              let letterClass = 'bg-white border border-slate-200 text-slate-700';

              if (isAnswered) {
                if (isCorrectChoice) {
                  btnClass =
                    'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs';
                  letterClass = 'bg-emerald-600 text-white border-emerald-600';
                } else if (isSelected) {
                  btnClass =
                    'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs';
                  letterClass = 'bg-rose-600 text-white border-rose-600';
                } else {
                  btnClass = 'bg-slate-50/50 border-slate-200/60 text-slate-400 opacity-60';
                  letterClass = 'bg-slate-100 text-slate-400 border-slate-200';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all duration-150 active:scale-[0.99] ${btnClass}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs ${letterClass}`}
                  >
                    {optionLetters[optIdx] || optIdx + 1}
                  </div>

                  <span className="flex-1 text-xs sm:text-sm tracking-tight leading-snug">
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

          {/* Explanation Banner */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl mt-4 text-xs leading-relaxed border animate-in fade-in duration-200 ${
                isCorrect
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleFetchAiExplanation(currentIndex)}
                  disabled={loadingAiExp[currentIndex]}
                  className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-indigo-700 font-bold border border-indigo-200/60 flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
                  title="Detailed AI Explanation"
                >
                  {loadingAiExp[currentIndex] ? (
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                  )}
                  <span>{aiExplanations[currentIndex] ? 'AI Detailed' : 'Ask AI Tutor'}</span>
                </button>
              </div>

              {currentMCQ.explanation ? (
                <p className="mt-1 text-slate-700 leading-relaxed font-normal">
                  {currentMCQ.explanation}
                </p>
              ) : (
                <p className="mt-1 text-slate-600 font-normal">
                  Correct Answer: <b>Option {optionLetters[currentMCQ.correctAnswer]}</b>
                </p>
              )}

              {/* Dynamic AI Explanation Box */}
              {aiExplanations[currentIndex] && (
                <div className="mt-3 pt-2.5 border-t border-indigo-200/50 text-indigo-950 bg-white/60 p-2.5 rounded-xl animate-in fade-in duration-150">
                  <span className="font-bold text-[11px] text-indigo-700 block mb-1">
                    💡 AI Tutor Breakdown:
                  </span>
                  <div className="whitespace-pre-wrap leading-relaxed font-normal">
                    {aiExplanations[currentIndex]}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Action Controls Bar */}
      <footer className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-md mx-auto w-full flex items-center gap-2">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrevious}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none text-slate-700 font-bold text-xs transition-all active:scale-95 shrink-0"
            aria-label="Previous question"
            title="Previous question"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Skip / Next / Submit Button */}
          {!isAnswered ? (
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-slate-200 active:scale-[0.98] transition-all"
            >
              <SkipForward className="w-4 h-4 text-slate-500" />
              <span>Skip Question</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 active:scale-[0.98] transition-all"
            >
              <span>{currentIndex < mcqs.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
