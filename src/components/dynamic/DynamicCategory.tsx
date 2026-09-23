import React from 'react';
import {
  Folder,
  BookOpen,
  GraduationCap,
  Award,
  Layers,
  Sparkles,
  Compass,
  FileCheck2,
} from 'lucide-react';
import type { Category } from '../../types';
import { useAudio } from '../../context/AudioContext';

interface DynamicCategoryProps {
  category: Category;
  isSelected?: boolean;
  onClick?: (category: Category) => void;
  variant?: 'card' | 'pill' | 'tile';
}

const getCategoryIcon = (iconName?: string) => {
  const name = (iconName || '').toLowerCase();
  if (name.includes('book')) return BookOpen;
  if (name.includes('cap') || name.includes('exam')) return GraduationCap;
  if (name.includes('award') || name.includes('star')) return Award;
  if (name.includes('layer')) return Layers;
  if (name.includes('test') || name.includes('check')) return FileCheck2;
  if (name.includes('compass')) return Compass;
  if (name.includes('spark')) return Sparkles;
  return Folder;
};

export const DynamicCategory: React.FC<DynamicCategoryProps> = ({
  category,
  isSelected,
  onClick,
  variant = 'card',
}) => {
  const { playTap } = useAudio();
  const Icon = getCategoryIcon(category.icon);

  const handleClick = () => {
    playTap();
    onClick?.(category);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all select-none whitespace-nowrap active:scale-95 ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{category.name}</span>
      </button>
    );
  }

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
      className={`group relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer select-none ${
        isSelected
          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/30'
          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform"
        style={{
          backgroundColor: category.color ? `${category.color}15` : '#eef2ff',
          color: category.color || '#4f46e5',
        }}
      >
        <Icon className="w-5 h-5" />
      </div>

      <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600">
        {category.name}
      </span>

      {category.hindiName && (
        <span className="text-[10px] text-slate-400 font-medium line-clamp-1">
          {category.hindiName}
        </span>
      )}
    </div>
  );
};
