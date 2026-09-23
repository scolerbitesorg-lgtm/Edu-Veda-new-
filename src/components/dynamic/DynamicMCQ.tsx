import React from 'react';
import { Check, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { MCQ } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicMCQProps {
  mcq: MCQ;
  index?: number;
  selectedAnswer?: number | null;
  onSelectAnswer?: (index: number) => void;
  showFeedback?: boolean;
  isReviewMode?: boolean;
}

export const DynamicMCQ: React.FC<DynamicMCQProps> = ({
  mcq,
  index,
  selectedAnswer = null,
  onSelectAnswer,
  showFeedback = false,
  isReviewMode = false,
}) => {
  const { playTap, playSuccess, playWrong } = useAudio();
  const [showExplanation, setShowExplanation] = React.useState(false);

  const options = Array.isArray(mcq.options) && mcq.options.length > 0
    ? mcq.options
    : [mcq.optionA || '', mcq.optionB || '', mcq.optionC || '', mcq.optionD || ''].filter(Boolean);

  const optionLabels = ['A', 'B', 'C', 'D'];

  const handleSelect = (idx: number) => {
    if (selectedAnswer !== null && showFeedback) return;
    if (idx === mcq.correctAnswer) {
      playSuccess();
    } else {
      playWrong();
    }
    onSelectAnswer?.(idx);
  };

  const getDifficultyBadge = () => {
    switch (mcq.difficulty) {
      case 'easy':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Easy</span>;
      case 'hard':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">Hard</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">Medium</span>;
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-4">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Q{index + 1}
            </span>
          )}
          {getDifficultyBadge()}
          {mcq.chapter && (
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
              {mcq.chapter}
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
        {mcq.question}
      </p>

      {mcq.hindiQuestion && (
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
          {mcq.hindiQuestion}
        </p>
      )}

      {/* Options List */}
      <div className="mt-3.5 space-y-2">
        {options.map((opt, idx) => {
          const isSelected = selectedAnswer === idx;
          const isCorrect = mcq.correctAnswer === idx;

          let optionStyle = 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
          let badgeStyle = 'bg-white border-slate-300 text-slate-600';

          if (showFeedback || isReviewMode) {
            if (isCorrect) {
              optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold';
              badgeStyle = 'bg-emerald-600 border-emerald-600 text-white';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-rose-50 border-rose-400 text-rose-950';
              badgeStyle = 'bg-rose-600 border-rose-600 text-white';
            }
          } else if (isSelected) {
            optionStyle = 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold shadow-xs';
            badgeStyle = 'bg-indigo-600 border-indigo-600 text-white';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={selectedAnswer !== null && showFeedback}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all text-xs sm:text-sm ${optionStyle}`}
            >
              <div
                className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 ${badgeStyle}`}
              >
                {showFeedback && isCorrect ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : showFeedback && isSelected && !isCorrect ? (
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  optionLabels[idx] || idx + 1
                )}
              </div>
              <span className="flex-1 leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation Toggle */}
      {(showFeedback || isReviewMode) && mcq.explanation && (
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showExplanation ? 'Hide Explanation' : 'View Detailed Explanation'}</span>
            {showExplanation ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showExplanation && (
            <div className="mt-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
              <strong className="font-bold text-indigo-900 block mb-1">Concept Solution:</strong>
              {mcq.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
