import React from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Topic } from '../types';
import { UniversalIcon } from './UniversalIcon';

interface TopicCardProps {
  topic: Topic;
  index: number;
  onClick: () => void;
  isCompleted?: boolean;
  progressPercent?: number;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  index,
  onClick,
  isCompleted = false,
  progressPercent = 0,
}) => {
  const percent = isCompleted ? 100 : Math.min(100, Math.max(0, Math.round(progressPercent)));
  const isFinished = percent >= 100;

  // Check custom icon/image from admin panel
  const customIcon = (
    topic.icon ||
    (topic as any).image ||
    (topic as any).thumbnail ||
    (topic as any).iconUrl
  )?.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all text-left flex items-center justify-between group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Topic Icon / Thumbnail / Index Frame */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden transition-colors ${
            isFinished
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-xs'
              : percent > 0
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          {isFinished ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : customIcon ? (
            <UniversalIcon
              icon={customIcon}
              name={topic.title}
              className="w-6 h-6 text-indigo-600"
              imgClassName="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-black text-slate-700">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-800 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
              {topic.title}
            </h4>
            {topic.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                {topic.badge}
              </span>
            )}
          </div>

          {topic.description ? (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {topic.description}
            </p>
          ) : (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              Lectures &bull; Notes &bull; Practice MCQs
            </p>
          )}

          {/* Topic Progress Bar & Percentage under Topic */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 max-w-[140px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFinished
                    ? 'bg-emerald-500'
                    : percent > 0
                    ? 'bg-indigo-600'
                    : 'bg-slate-300'
                }`}
                style={{ width: `${Math.max(percent > 0 ? 5 : 0, percent)}%` }}
              />
            </div>
            <span
              className={`text-[11px] font-bold tracking-tight ${
                isFinished
                  ? 'text-emerald-600'
                  : percent > 0
                  ? 'text-indigo-600'
                  : 'text-slate-400'
              }`}
            >
              {isFinished ? '100% Completed' : percent > 0 ? `${percent}% Completed` : '0% Completed'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
};
