import React from 'react';
import { ChevronRight, Play, FileText, CheckSquare } from 'lucide-react';
import type { Topic } from '../types';
import { UniversalIcon } from './UniversalIcon';

interface TopicCardProps {
  topic: Topic;
  index: number;
  onClick: () => void;
  mcqCount?: number;
  lectureCount?: number;
  noteCount?: number;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  index,
  onClick,
  mcqCount = 0,
  lectureCount = 0,
  noteCount = 0,
}) => {
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
      className="w-full bg-white rounded-2xl p-4 border border-slate-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-indigo-200 active:scale-[0.98] transition-all text-left flex items-center justify-between group cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Topic Icon / Thumbnail / Index Frame */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          {customIcon ? (
            <UniversalIcon
              icon={customIcon}
              name={topic.title}
              className="w-6 h-6 text-indigo-600"
              imgClassName="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-black text-slate-700 group-hover:text-indigo-600">
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

          {/* Topic Learning Materials Pills with MCQs prominently displayed */}
          <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px]">
            {/* MCQs Pill - highlighted */}
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
              <CheckSquare className="w-3 h-3 text-emerald-600" />
              <span>{mcqCount} MCQs</span>
            </span>

            {/* Lectures Pill */}
            {lectureCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                <Play className="w-3 h-3 text-purple-600" />
                <span>{lectureCount} {lectureCount === 1 ? 'Lecture' : 'Lectures'}</span>
              </span>
            )}

            {/* Notes Pill */}
            {noteCount > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                <FileText className="w-3 h-3 text-sky-600" />
                <span>{noteCount} {noteCount === 1 ? 'Note' : 'Notes'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shrink-0">
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
};
