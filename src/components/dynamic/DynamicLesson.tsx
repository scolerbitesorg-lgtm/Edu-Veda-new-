import React from 'react';
import { PlayCircle, FileText, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import type { Topic, Lecture, Note } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicLessonProps {
  topic: Topic;
  lecturesCount?: number;
  notesCount?: number;
  progress?: number;
  isCompleted?: boolean;
  onOpenTopic?: (topic: Topic) => void;
  onPlayLecture?: (topic: Topic) => void;
  onReadNotes?: (topic: Topic) => void;
}

export const DynamicLesson: React.FC<DynamicLessonProps> = ({
  topic,
  lecturesCount = 0,
  notesCount = 0,
  progress = 0,
  isCompleted = false,
  onOpenTopic,
  onPlayLecture,
  onReadNotes,
}) => {
  const { playTap } = useAudio();

  return (
    <div className="flex flex-col p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            ) : progress > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                <span>In Progress ({Math.round(progress)}%)</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400">
                Chapter
              </span>
            )}

            {topic.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 uppercase">
                {topic.badge}
              </span>
            )}
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
          className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          aria-label="View chapter"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            playTap();
            onPlayLecture ? onPlayLecture(topic) : onOpenTopic?.(topic);
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 active:scale-95 transition-all"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Watch Lectures</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTap();
            onReadNotes ? onReadNotes(topic) : onOpenTopic?.(topic);
          }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Study Notes</span>
        </button>
      </div>
    </div>
  );
};
