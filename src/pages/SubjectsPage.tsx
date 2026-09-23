import React, { useEffect, useState } from 'react';
import { Search, BookOpen, ArrowLeft, Filter } from 'lucide-react';
import type { Subject, Category } from '../types';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { subscribeToCategories } from '../services/categories';
import { DynamicSubject, DynamicCategory } from '../components/dynamic';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';

interface SubjectsPageProps {
  onSelectSubject: (subjectId: string) => void;
  onBack?: () => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  onSelectSubject,
  onBack,
}) => {
  const { playTap } = useAudio();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSubjects = subscribeToPublishedSubjects(subs => {
      setSubjects(subs);
      setLoading(false);
    });

    const unsubCategories = subscribeToCategories(cats => {
      setCategories(cats);
    });

    return () => {
      unsubSubjects();
      unsubCategories();
    };
  }, []);

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.hindiName && s.hindiName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      !selectedCategory ||
      s.categoryId === selectedCategory ||
      s.category === selectedCategory;

    return matchesSearch && matchesCategory;
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
              All Subjects
            </h1>
            <p className="text-xs text-slate-500">
              Select any curriculum module to start studying
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search subjects or chapters..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Categories Filter Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playTap();
              setSelectedCategory(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <DynamicCategory
              key={cat.id}
              category={cat}
              variant="pill"
              isSelected={selectedCategory === cat.id || selectedCategory === cat.name}
              onClick={() =>
                setSelectedCategory(prev => (prev === cat.id ? null : cat.id))
              }
            />
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingState message="Loading subjects..." />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Subjects Found"
          description={
            searchQuery || selectedCategory
              ? 'Try changing your search terms or category filter.'
              : 'Subjects created in the Admin Web will appear here automatically.'
          }
        />
      ) : (
        <div className="space-y-3.5">
          {filteredSubjects.map((sub, idx) => (
            <DynamicSubject
              key={sub.id}
              subject={sub}
              index={idx + 1}
              onClick={() => onSelectSubject(sub.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
