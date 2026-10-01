import React from 'react';
import { PlayCircle, FileText, CheckSquare, ChevronRight } from 'lucide-react';
import type { Topic } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicLessonProps {
  topic: Topic;
  lecturesCount?: number;
  notesCount?: number;
  mcqCount?: number;
  onOpenTopic?: (topic: Topic) => void;
  onPlayLecture?: (topic: Topic) => void;
  onReadNotes?: (topic: Topic) => void;
  onPracticeMCQs?: (topic: Topic) => void;
}

export const DynamicLesson: React.FC<DynamicLessonProps> = ({
  topic,
  lecturesCount = 0,
  notesCount = 0,
  mcqCount = 0,
  onOpenTopic,
  onPlayLecture,
  onReadNotes,
  onPracticeMCQs,
}) => {
  const { playTap } = useAudio();

  const actualMCQs = mcqCount || topic.mcqCount || 5;

  return (
    <div className="flex flex-col p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Lesson
            </span>

            {topic.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 uppercase">
                {topic.badge}
              </span>
            )}

            {/* MCQs count on Lesson */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <CheckSquare className="w-3 h-3 text-emerald-600" />
              <span>{actualMCQs} MCQs</span>
            </span>
          </div>

          <h4
            role="button"
            tabIndex={0}
            onClick={() => {
              playTap();
              onOpenTopic?.(topic);
            }}
            className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors"
          >
            {topic.title}
          </h4>

          {topic.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              {topic.description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            playTap();
            onOpenTopic?.(topic);
          }}
          className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
          aria-label="View lesson"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => {
            playTap();
            onPlayLecture ? onPlayLecture(topic) : onOpenTopic?.(topic);
          }}
          className="inline-flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 active:scale-95 transition-all cursor-pointer truncate"
        >
          <PlayCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Lectures</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTap();
            onReadNotes ? onReadNotes(topic) : onOpenTopic?.(topic);
          }}
          className="inline-flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 active:scale-95 transition-all cursor-pointer truncate"
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Notes</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTap();
            onPracticeMCQs ? onPracticeMCQs(topic) : onOpenTopic?.(topic);
          }}
          className="inline-flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer truncate"
        >
          <CheckSquare className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">MCQs ({actualMCQs})</span>
        </button>
      </div>
    </div>
  );
};
