import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Award,
  Grid,
  SkipForward,
  Sliders,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { saveMockAttempt } from '../services/attempts';
import type { MockTest, MCQ } from '../types';

interface MockTestViewerProps {
  mockTest: MockTest;
  questions: MCQ[];
  onExit: () => void;
  customNegativeMarking?: number;
}

export const MockTestViewer: React.FC<MockTestViewerProps> = ({
  mockTest,
  questions,
  onExit,
  customNegativeMarking,
}) => {
  const { user } = useAuth();
  const { playTap, playComplete } = useAudio();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>((mockTest.duration || 15) * 60);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [showMarkingModal, setShowMarkingModal] = useState<boolean>(false);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);

  // Dynamic Negative Marking Penalty state
  const [negativePenalty, setNegativePenalty] = useState<number>(() => {
    if (customNegativeMarking !== undefined) return customNegativeMarking;
    return mockTest.negativeMarking !== undefined ? mockTest.negativeMarking : 0.33;
  });
  const [customInputMark, setCustomInputMark] = useState<string>(String(negativePenalty));
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    ![0, 0.25, 0.33, 0.5, 1].includes(negativePenalty)
  );

  const presetOptions = [
    { label: '0 (None)', value: 0, desc: 'Practice Mode (No negative marking)' },
    { label: '0.25 (1/4th)', value: 0.25, desc: 'SSC / Banking pattern' },
    { label: '0.33 (1/3rd)', value: 0.33, desc: 'UPSC / Standard CBT pattern' },
    { label: '0.50 (1/2)', value: 0.5, desc: 'Strict negative penalty' },
    { label: '1.0 (Full)', value: 1.0, desc: '1:1 Negative penalty' },
  ];

  // Countdown Timer
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
      setTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const currentQ = questions[currentIndex];
  const qId = currentQ?.id || `q_${currentIndex}`;
  const isMarked = !!markedForReview[qId];
  const currentSelection = userAnswers[qId];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const handleSelectOption = (optIndex: number) => {
    playTap();
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optIndex,
    }));
  };

  const handleClearSelection = () => {
    playTap();
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleSkipQuestion = () => {
    playTap();
    if (userAnswers[qId] !== undefined) {
      setUserAnswers(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleToggleReview = () => {
    playTap();
    setMarkedForReview(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleSubmitTest = async () => {
    setIsSubmitted(true);
    setShowSubmitModal(false);
    playComplete();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

    // Compute statistics
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q, idx) => {
      const qKey = q.id || `q_${idx}`;
      const chosen = userAnswers[qKey];
      if (chosen === undefined) {
        skipped++;
      } else if (chosen === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = questions.length;
    const penalty = negativePenalty;
    const netScore = Math.max(0, Number((correct * 1 - wrong * penalty).toFixed(2)));
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    if (user) {
      try {
        await saveMockAttempt({
          uid: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Student',
          userEmail: user.email || '',
          mockId: mockTest.id,
          mockTitle: mockTest.title,
          score: netScore,
          total,
          correct,
          wrong,
          skipped,
          percentage,
          timeTaken,
          answers: userAnswers,
        });
      } catch (err) {
        console.error('Failed to save mock attempt:', err);
      }
    }
  };

  // If no questions in test
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center border border-slate-100 shadow-sm max-w-md mx-auto">
        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">No Questions Available</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This test currently has no published questions attached.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Result & Detailed Analysis Screen
  if (isSubmitted) {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    questions.forEach((q, idx) => {
      const qKey = q.id || `q_${idx}`;
      const chosen = userAnswers[qKey];
      if (chosen === undefined) {
        skipped++;
      } else if (chosen === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = questions.length;
    const penalty = negativePenalty;
    const netScore = Math.max(0, Number((correct * 1 - wrong * penalty).toFixed(2)));
    const attempted = correct + wrong;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const estimatedRank = Math.max(1, Math.round((1 - (percentage / 100) * 0.95) * 1480));
    const isPassed = mockTest.cutoffPercentage ? percentage >= mockTest.cutoffPercentage : percentage >= 40;

    return (
      <div className="max-w-md mx-auto pb-12 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md">
          {/* Header Score Card */}
          <div className="text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/25">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">CBT Test Report</h2>
            <p className="text-xs text-slate-500 mt-0.5">{mockTest.title}</p>
          </div>

          {/* Primary Score Ring / Numbers */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 text-center">
            <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">
              {netScore} <span className="text-lg font-normal text-slate-400">/ {total}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-600">
                Net Score ({percentage}%)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isPassed ? 'Cutoff Qualified' : 'Below Cutoff'}
              </span>
            </div>
          </div>

          {/* All-India Rank & Cutoff Banner */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 text-center">
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/60">
              <span className="text-[11px] font-semibold text-indigo-700 block">Estimated Rank</span>
              <span className="text-base font-bold text-indigo-900 font-mono">#{estimatedRank} <span className="text-[10px] font-normal text-indigo-600">/ 1.5k</span></span>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100/60">
              <span className="text-[11px] font-semibold text-purple-700 block">
                Penalty ({penalty === 0 ? '0' : `-${penalty}`}/Q)
              </span>
              <span className="text-base font-bold text-rose-700 font-mono">-{(wrong * penalty).toFixed(2)}</span>
            </div>
          </div>

          {/* Detailed Statistics Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/60">
              <span className="text-[11px] font-semibold text-emerald-700 block">Correct (+1)</span>
              <span className="text-xl font-bold text-emerald-900">{correct}</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100/60">
              <span className="text-[11px] font-semibold text-rose-700 block">
                Wrong ({penalty === 0 ? '0' : `-${penalty}`})
              </span>
              <span className="text-xl font-bold text-rose-900">{wrong}</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100/60">
              <span className="text-[11px] font-semibold text-amber-700 block">Skipped</span>
              <span className="text-xl font-bold text-amber-900">{skipped}</span>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100/60">
              <span className="text-[11px] font-semibold text-cyan-700 block">Accuracy</span>
              <span className="text-xl font-bold text-cyan-900">{accuracy}%</span>
            </div>
          </div>

          {/* Time Taken */}
          <div className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100/40 flex items-center justify-between text-xs text-slate-700 mb-5">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Time Spent:</span>
            </div>
            <span className="font-bold text-indigo-700 font-mono">
              {formatTime(timeTaken)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            <button
              type="button"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showAnalysis ? 'Hide Detailed Analysis' : 'View Question-wise Analysis'}</span>
            </button>

            <button
              type="button"
              onClick={onExit}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
            >
              Back to Tests
            </button>
          </div>

          {/* Question-wise Detailed Analysis */}
          {showAnalysis && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question-Wise Analysis
              </h3>
              {questions.map((q, idx) => {
                const qKey = q.id || `q_${idx}`;
                const chosen = userAnswers[qKey];
                const isSkipped = chosen === undefined;
                const isAnsCorrect = chosen === q.correctAnswer;

                return (
                  <div
                    key={qKey}
                    className={`p-4 rounded-2xl border text-xs ${
                      isSkipped
                        ? 'bg-slate-50 border-slate-200'
                        : isAnsCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-800 leading-snug">
                        Q{idx + 1}. {q.question}
                      </span>
                      {isSkipped ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                          Skipped
                        </span>
                      ) : isAnsCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="space-y-1 my-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrectOpt = optIdx === q.correctAnswer;
                        const isChosenOpt = optIdx === chosen;
                        return (
                          <div
                            key={optIdx}
                            className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] ${
                              isCorrectOpt
                                ? 'bg-emerald-100 text-emerald-950 font-bold'
                                : isChosenOpt
                                ? 'bg-rose-100 text-rose-950 font-medium'
                                : 'text-slate-600'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                            {isCorrectOpt && (
                              <span className="text-[10px] text-emerald-700">Correct Answer</span>
                            )}
                            {isChosenOpt && !isCorrectOpt && (
                              <span className="text-[10px] text-rose-700">Your Selection</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-relaxed">
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
      </div>
    );
  }

  // Active Test Screen
  return (
    <div className="max-w-md mx-auto pb-12">
      {/* Top Test Header with Timer, Marking Scheme, & Palette trigger */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between mb-4 sticky top-14 z-30">
        <div>
          <button
            type="button"
            onClick={() => setShowMarkingModal(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline"
            title="Click to view/change negative marking"
          >
            <Sliders className="w-3 h-3" />
            <span>Marking: +1 / {negativePenalty === 0 ? '0' : `-${negativePenalty}`}</span>
          </button>
          <h3 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
            {mockTest.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono transition-colors ${
              timeLeft < 180
                ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Palette Button */}
          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-all"
            aria-label="Question Navigation Palette"
            title="Question Palette"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Negative Marking Customization Modal during Test */}
      {showMarkingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-150 select-none">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-sm">Negative Marking Scheme</h4>
              <button
                type="button"
                onClick={() => setShowMarkingModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-1.5 mb-3">
              {presetOptions.map(opt => {
                const isSelected = !isCustomMode && negativePenalty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setNegativePenalty(opt.value);
                    }}
                    className={`w-full p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                  isCustomMode
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>Custom Deduction</span>
                {isCustomMode && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
              </button>
            </div>

            {isCustomMode && (
              <div className="mb-3">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="10"
                  value={customInputMark}
                  onChange={e => {
                    setCustomInputMark(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed) && parsed >= 0) {
                      setNegativePenalty(parsed);
                    }
                  }}
                  placeholder="e.g. 0.25"
                  className="w-full bg-slate-50 border border-indigo-300 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-950 focus:outline-none"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowMarkingModal(false)}
              className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Apply Scheme
            </button>
          </div>
        </div>
      )}

      {/* Question Palette Drawer Modal */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="font-bold text-slate-900 text-sm">Question Navigation</h4>
              <button
                type="button"
                onClick={() => setShowPalette(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-1 mb-4">
              {questions.map((q, idx) => {
                const key = q.id || `q_${idx}`;
                const hasAnswered = userAnswers[key] !== undefined;
                const isRev = markedForReview[key];
                const isCurr = idx === currentIndex;

                let cls = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isCurr) {
                  cls = 'ring-2 ring-indigo-600 font-bold';
                }
                if (isRev) {
                  cls = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
                } else if (hasAnswered) {
                  cls = 'bg-indigo-600 text-white border-indigo-600 font-semibold';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowPalette(false);
                    }}
                    className={`h-9 rounded-xl flex items-center justify-center text-xs border transition-transform active:scale-95 ${cls}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-200 border border-amber-400" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-200" />
                <span>Not Attempted</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md mb-4">
        {/* Top Indicators */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
            Question {currentIndex + 1} of {questions.length}
          </span>

          <button
            type="button"
            onClick={handleToggleReview}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              isMarked
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-600' : ''}`} />
            <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
          </button>
        </div>

        {/* Question Statement */}
        <h3 className="font-bold text-slate-900 text-base leading-relaxed tracking-tight mb-5">
          {currentQ.question}
        </h3>

        {/* Four Options */}
        <div className="space-y-2.5 mb-6">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = currentSelection === optIdx;
            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full min-h-[50px] p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-semibold ring-1 ring-indigo-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50/60 hover:border-indigo-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}
                </div>

                <span className="flex-1 text-sm tracking-tight leading-snug">
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              playTap();
              setCurrentIndex(prev => prev - 1);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Middle Actions: Clear selection & Skip question */}
          <div className="flex items-center gap-1.5">
            {currentSelection !== undefined && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all active:scale-95"
                title="Clear selected option"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={handleSkipQuestion}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
              title="Skip this question and go to next"
            >
              <SkipForward className="w-3.5 h-3.5 text-slate-500" />
              <span>Skip</span>
            </button>
          </div>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                playTap();
                setCurrentIndex(prev => prev + 1);
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom Quick Submit Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="text-xs font-semibold text-slate-500 hover:text-indigo-600 underline underline-offset-4"
        >
          Review and Submit Test
        </button>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold text-slate-900 text-center tracking-tight">
              Submit Test?
            </h4>
            <p className="text-xs text-slate-500 text-center mt-1 mb-4 leading-relaxed">
              You have answered {Object.keys(userAnswers).length} out of {questions.length} questions.
              Are you sure you want to finish?
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSubmitTest}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Yes, Submit Now
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-all"
              >
                Continue Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
