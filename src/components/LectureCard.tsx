import React, { useState } from 'react';
import { Play, Clock, CheckCircle } from 'lucide-react';
import type { Lecture } from '../types';
import { UniversalIcon } from './UniversalIcon';

interface LectureCardProps {
  lecture: Lecture;
  onClick: () => void;
  progressPercent?: number;
}

export const LectureCard: React.FC<LectureCardProps> = ({
  lecture,
  onClick,
  progressPercent = 0,
}) => {
  const [imgError, setImgError] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '15 mins';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs} mins`;
  };

  const isFinished = progressPercent >= 90;

  // Check all potential thumbnail/icon properties from Firestore
  const customMedia = (
    lecture.thumbnail ||
    (lecture as any).image ||
    (lecture as any).icon ||
    (lecture as any).thumbnailUrl ||
    (lecture as any).logo
  )?.trim();

  const isMediaUrl =
    customMedia &&
    (customMedia.startsWith('http://') ||
      customMedia.startsWith('https://') ||
      customMedia.startsWith('data:image/') ||
      customMedia.startsWith('blob:') ||
      customMedia.startsWith('/'));

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_3px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all text-left flex items-center justify-between group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Lecture Media Thumbnail / Icon Frame */}
        <div className="relative w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60 flex items-center justify-center">
          {customMedia && isMediaUrl && !imgError ? (
            <img
              src={customMedia}
              alt={lecture.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : customMedia && !isMediaUrl ? (
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center p-2 text-indigo-600">
              <UniversalIcon
                icon={customMedia}
                name={lecture.title}
                className="w-6 h-6 text-indigo-600"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <Play className="w-5 h-5 fill-white" />
            </div>
          )}

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-md">
              <Play className="w-3.5 h-3.5 fill-indigo-600 ml-0.5" />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-slate-800 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
              {lecture.title}
            </h4>
            {isFinished && (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )}
          </div>
          {lecture.instructorName && (
            <p className="text-[11px] font-medium text-indigo-600 truncate mt-0.5">
              By {lecture.instructorName}
            </p>
          )}
          {lecture.description && (
            <p className="text-xs text-slate-500 truncate mt-0.5 max-w-[220px]">
              {lecture.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatDuration(lecture.duration)}
            </span>
            {progressPercent > 0 && (
              <span className="text-indigo-600 font-medium">
                {progressPercent}% watched
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ml-2 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </div>
    </button>
  );
};
