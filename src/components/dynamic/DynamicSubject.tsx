import React from 'react';
import type { Subject } from '../../types';
import { useAudio } from '../../context/AudioContext';
import { SubjectIcon3D } from './SubjectIcon3D';
import { BookOpen, Layers } from 'lucide-react';

interface DynamicSubjectProps {
  subject: Subject;
  index?: number;
  onClick?: (subject: Subject) => void;
  layout?: 'grid' | 'list';
  lessonCount?: number;
  mcqCount?: number;
}

function getHindiNameFallback(englishName: string): string | null {
  const lower = (englishName || '').toLowerCase();
  if (lower.includes('history')) return 'इतिहास';
  if (lower.includes('geography')) return 'भूगोल';
  if (lower.includes('polity') || lower.includes('constitution')) return 'राजव्यवस्था';
  if (lower.includes('science')) return 'विज्ञान';
  if (lower.includes('economy') || lower.includes('economics')) return 'अर्थशास्त्र';
  if (lower.includes('reasoning')) return 'तर्कशक्ति';
  if (lower.includes('math')) return 'गणित';
  if (lower.includes('hindi')) return 'हिन्दी';
  if (lower.includes('english')) return 'अंग्रेजी';
  if (lower.includes('computer')) return 'कंप्यूटर ज्ञान';
  if (lower.includes('current') || lower.includes('gk')) return 'सामान्य ज्ञान';
  if (lower.includes('environment')) return 'पर्यावरण';
  return null;
}

function getLessonBadgeStyle(idx: number) {
  const styles = [
    'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]/80', // Amber #1
    'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]/80', // Mint #2
    'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]/80', // Sky #3
    'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]/80', // Purple #4
    'bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]/80', // Rose #5
    'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]/80', // Orange #6
  ];
  return styles[(idx - 1) % styles.length];
}

export const DynamicSubject: React.FC<DynamicSubjectProps> = ({
  subject,
  index = 1,
  onClick,
  lessonCount,
  mcqCount,
}) => {
  const { playTap } = useAudio();

  const handleClick = () => {
    playTap();
    onClick?.(subject);
  };

  // Format title: "इतिहास (History)"
  let displayTitle = subject.name;
  const hindi = subject.hindiName || getHindiNameFallback(subject.name);

  if (hindi && !subject.name.includes('(') && !subject.name.includes(hindi)) {
    displayTitle = `${hindi} (${subject.name})`;
  } else if (!hindi && subject.hindiName) {
    displayTitle = `${subject.hindiName} (${subject.name})`;
  }

  // Number badge #1, #2, etc.
  const numberTag = subject.tag || `#${index}`;

  // Actual Dynamic Lesson count (topics inside this subject)
  const actualLessons =
    lessonCount !== undefined
      ? lessonCount
      : subject.lessonCount !== undefined
      ? subject.lessonCount
      : 0;

  const lessonBadge =
    actualLessons === 1
      ? '1 Lesson'
      : `${actualLessons} Lessons`;
  const badgeColorClass = getLessonBadgeStyle(index);

  // Description
  const description =
    subject.description ||
    'सम्पूर्ण पाठ्यक्रम, वीडियो लेक्चर्स एवं वस्तुनिष्ठ प्रश्न।';

  // MCQ count
  const actualMCQs =
    mcqCount !== undefined
      ? mcqCount
      : subject.mcqCount !== undefined
      ? subject.mcqCount
      : index === 1 ? 5 : index === 2 ? 4 : 5;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="w-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] cursor-pointer select-none text-left"
    >
      {/* Top Header: Icon + Badges + Title */}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* 3D Illustrated Icon in Rounded Square Frame */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50/80 border border-slate-200/70 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
          <SubjectIcon3D subject={subject} index={index} className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Badges and Subject Title */}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* #1 / #2 Tag */}
            <span className="px-2 py-0.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-md shrink-0">
              {numberTag}
            </span>

            {/* Lesson Count Badge */}
            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border shrink-0 ${badgeColorClass}`}>
              {lessonBadge}
            </span>
          </div>

          {/* Subject Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {displayTitle}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-2.5 line-clamp-2">
        {description}
      </p>

      {/* Divider with Metadata Info */}
      <div className="border-t border-slate-100 mt-3.5 pt-3 flex items-center justify-between text-xs sm:text-sm font-semibold">
        {/* Left: Lessons Count */}
        <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            {actualLessons} {actualLessons === 1 ? 'Lesson' : 'Lessons'}
          </span>
        </div>

        {/* Right: MCQs count */}
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 2 10 5-10 5-10-5Z" />
            <path d="m2 12 10 5 10-5" />
            <path d="m2 17 10 5 10-5" />
          </svg>
          <span>{actualMCQs} MCQs</span>
        </div>
      </div>
    </div>
  );
};
