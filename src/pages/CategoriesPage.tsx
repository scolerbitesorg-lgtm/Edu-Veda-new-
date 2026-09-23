import React, { useEffect, useState } from 'react';
import { Search, Folder, ArrowLeft, BookOpen, RefreshCw } from 'lucide-react';
import type { Category, Subject } from '../types';
import { subscribeToCategories } from '../services/categories';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { DynamicCategory, DynamicSubject } from '../components/dynamic';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';

interface CategoriesPageProps {
  onSelectSubject: (subjectId: string) => void;
  onBack?: () => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onSelectSubject,
  onBack,
}) => {
  const { playTap } = useAudio();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCat = subscribeToCategories(cats => {
      setCategories(cats);
      setLoading(false);
    });

    const unsubSub = subscribeToPublishedSubjects(subs => {
      setSubjects(subs);
    });

    return () => {
      unsubCat();
      unsubSub();
    };
  }, []);

  const filteredCategories = categories.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.hindiName && c.hindiName.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const filteredSubjects = subjects.filter(s => {
    if (!selectedCategoryId) return true;
    return s.categoryId === selectedCategoryId || s.category === selectedCategory?.name;
  });

  return (
    <div className="pb-24 max-w-md mx-auto px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                playTap();
                onBack();
              }}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Curriculum Categories
            </h1>
            <p className="text-xs text-slate-500">
              Browse syllabus streams and target exams
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <LoadingState message="Loading categories..." />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No Categories Configured"
          description="Categories configured by Admin in the Admin Web will appear here in real-time."
        />
      ) : (
        <>
          {/* Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Stream
              </h2>
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {filteredCategories.map(cat => (
                <DynamicCategory
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategoryId === cat.id}
                  onClick={() => {
                    setSelectedCategoryId(prev => (prev === cat.id ? null : cat.id));
                  }}
                />
              ))}
            </div>
          </div>

          {/* Subjects in this category */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {selectedCategory ? `${selectedCategory.name} Subjects` : 'All Subjects'}
              </h2>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {filteredSubjects.length} Available
              </span>
            </div>

            {filteredSubjects.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/60">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No subjects in this category</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Check other categories or see all subjects.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSubjects.map(sub => (
                  <DynamicSubject
                    key={sub.id}
                    subject={sub}
                    layout="list"
                    onClick={() => onSelectSubject(sub.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
