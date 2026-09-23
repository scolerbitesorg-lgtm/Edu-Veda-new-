import React from 'react';
import { Timer, Award, AlertCircle, PlayCircle, HelpCircle } from 'lucide-react';
import type { MockTest } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicTestProps {
  test: MockTest;
  onStartTest: (test: MockTest) => void;
}

export const DynamicTest: React.FC<DynamicTestProps> = ({ test, onStartTest }) => {
  const { playTap } = useAudio();

  const totalQuestions = test.totalQuestions || test.questionIds?.length || 25;
  const totalMarks = test.totalMarks || totalQuestions * 2;
  const negativeMarking = test.negativeMarking ?? 0.25;

  return (
    <div className="flex flex-col justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {test.subject && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                {test.subject}
              </span>
            )}
            {test.featured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 uppercase">
                Featured
              </span>
            )}
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2">
          {test.title}
        </h3>

        {test.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {test.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3.5 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
              <Timer className="w-3 h-3 text-indigo-600" />
              <span>Time</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {test.duration}m
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
              <HelpCircle className="w-3 h-3 text-indigo-600" />
              <span>Questions</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {totalQuestions}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
              <Award className="w-3 h-3 text-indigo-600" />
              <span>Marks</span>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {totalMarks}
            </p>
          </div>
        </div>

        {negativeMarking > 0 && (
          <p className="text-[11px] text-amber-700/90 font-medium flex items-center gap-1 mt-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>Negative Marking: -{negativeMarking} per wrong answer</span>
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            playTap();
            onStartTest(test);
          }}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Attempt Test Now</span>
        </button>
      </div>
    </div>
  );
};
