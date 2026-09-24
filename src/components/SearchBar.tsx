import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Layers, Play, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { searchEducationalContent, type GroupedSearchResults } from '../services/search';
import { useAudio } from '../context/AudioContext';

interface SearchBarProps {
  onSelectResult: (
    type: 'subject' | 'topic' | 'lecture' | 'note' | 'pyq' | 'test',
    id: string,
    context?: { subjectId?: string; topicId?: string }
  ) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectResult }) => {
  const { playTap } = useAudio();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [results, setResults] = useState<GroupedSearchResults>({
    subjects: [],
    topics: [],
    lectures: [],
    notes: [],
    totalCount: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ subjects: [], topics: [], lectures: [], notes: [], totalCount: 0 });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const res = await searchEducationalContent(searchTerm);
        setResults(res);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search subjects, lessons, lectures, notes..."
          className="w-full bg-white pl-10 pr-9 py-2.5 rounded-2xl border border-slate-200/80 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grouped Search Dropdown / Overlay */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute top-12 left-0 right-0 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-[70vh] overflow-y-auto p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isSearching ? 'Searching...' : `Found ${results.totalCount} results`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-indigo-600 font-semibold hover:underline"
            >
              Done
            </button>
          </div>

          {isSearching && (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mb-1" />
              <span className="text-xs">Searching curriculum...</span>
            </div>
          )}

          {!isSearching && results.totalCount === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No educational content matches "{searchTerm}".
            </div>
          )}

          {!isSearching && results.totalCount > 0 && (
            <div className="space-y-4">
              {/* Subjects Group */}
              {results.subjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-bold text-indigo-600">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Subjects ({results.subjects.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.subjects.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsOpen(false);
                          onSelectResult('subject', item.id);
                        }}
                        className="w-full p-2 rounded-xl hover:bg-indigo-50/60 text-left flex items-center justify-between text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-800">{item.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lessons Group */}
              {results.topics.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-bold text-indigo-600">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Lessons ({results.topics.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.topics.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsOpen(false);
                          onSelectResult('topic', item.id, { subjectId: item.subjectId });
                        }}
                        className="w-full p-2 rounded-xl hover:bg-indigo-50/60 text-left flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 block">{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lectures Group */}
              {results.lectures.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-bold text-indigo-600">
                    <Play className="w-3.5 h-3.5" />
                    <span>Lectures ({results.lectures.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.lectures.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsOpen(false);
                          onSelectResult('lecture', item.id, {
                            subjectId: item.subjectId,
                            topicId: item.topicId,
                          });
                        }}
                        className="w-full p-2 rounded-xl hover:bg-indigo-50/60 text-left flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 block">{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Group */}
              {results.notes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5 text-xs font-bold text-indigo-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Notes ({results.notes.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.notes.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playTap();
                          setIsOpen(false);
                          onSelectResult('note', item.id, {
                            subjectId: item.subjectId,
                            topicId: item.topicId,
                          });
                        }}
                        className="w-full p-2 rounded-xl hover:bg-indigo-50/60 text-left flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 block">{item.title}</span>
                          <span className="text-[10px] text-slate-400">{item.subtitle}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
