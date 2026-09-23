import React, { useState } from 'react';
import { Award, Clock, HelpCircle, ArrowRight, Settings2, Sliders, Check } from 'lucide-react';
import type { MockTest } from '../types';

interface MockTestCardProps {
  test: MockTest;
  onStart: (selectedNegativeMarking: number) => void;
  bestScore?: number;
}

export const MockTestCard: React.FC<MockTestCardProps> = ({
  test,
  onStart,
  bestScore,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const defaultPenalty = test.negativeMarking !== undefined ? test.negativeMarking : 0.33;
  const [selectedPenalty, setSelectedPenalty] = useState<number>(defaultPenalty);
  const [customValue, setCustomValue] = useState<string>(String(defaultPenalty));
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    ![0, 0.25, 0.33, 0.5, 1].includes(defaultPenalty)
  );

  const questionCount = test.questionIds?.length || test.totalQuestions || 10;

  const presetOptions = [
    { label: '0 (None)', value: 0, desc: 'Practice Mode' },
    { label: '0.25 (1/4th)', value: 0.25, desc: 'SSC / Banking' },
    { label: '0.33 (1/3rd)', value: 0.33, desc: 'UPSC / CBT Standard' },
    { label: '0.50 (1/2)', value: 0.5, desc: 'Strict Mode' },
    { label: '1.0 (Full)', value: 1.0, desc: '1:1 Penalty' },
  ];

  const handleStartWithPenalty = () => {
    let finalPenalty = selectedPenalty;
    if (isCustomMode) {
      const parsed = parseFloat(customValue);
      finalPenalty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    }
    setShowConfigModal(false);
    onStart(finalPenalty);
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Award className="w-5 h-5 stroke-[2]" />
          </div>
          {bestScore !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              Best Score: {bestScore}%
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-800 text-base tracking-tight mb-1">
          {test.title}
        </h3>
        {test.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
            {test.description}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 py-2 border-y border-slate-100 text-xs text-slate-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{test.duration} Mins</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>{questionCount} Qs</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
            <Sliders className="w-3 h-3" />
            <span>
              Negative: {selectedPenalty === 0 ? 'None (0)' : `-${selectedPenalty}`}
            </span>
          </div>
        </div>

        {/* Tags */}
        {test.tags && test.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1.5 mb-3">
            {test.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
            title="Custom Negative Marking Options"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
          >
            <span>Start Test (Select Marking)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Negative Marking Customization Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Negative Marking Scheme</h4>
                <p className="text-[11px] text-slate-500">Choose or enter custom deduction per wrong answer</p>
              </div>
            </div>

            {/* Test Summary */}
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex justify-between mb-4">
              <span><b>Test:</b> {test.title}</span>
              <span><b>{questionCount}</b> Questions</span>
            </div>

            {/* Preset Options Grid */}
            <div className="space-y-2 mb-3">
              {presetOptions.map(opt => {
                const isSelected = !isCustomMode && selectedPenalty === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setSelectedPenalty(opt.value);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs block font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-500">{opt.desc}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Custom Input Option */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isCustomMode
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="text-xs block font-bold">Custom Deduction Value</span>
                  <span className="text-[10px] text-slate-500">Specify your own custom penalty marks</span>
                </div>
                {isCustomMode && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            </div>

            {/* Custom Input Field */}
            {isCustomMode && (
              <div className="mb-4 animate-in fade-in duration-150">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Marks Deducted per Wrong MCQ:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={customValue}
                    onChange={e => setCustomValue(e.target.value)}
                    placeholder="e.g. 0.20 or 0.66"
                    className="w-full bg-slate-50 border border-indigo-300 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="text-xs font-bold text-slate-500">Marks</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleStartWithPenalty}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Confirm & Begin Exam
              </button>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
