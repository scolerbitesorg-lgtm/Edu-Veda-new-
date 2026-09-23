import React, { useEffect, useState } from 'react';
import { Search, FileText, Download, ExternalLink, Calendar, Award, ArrowLeft, Filter } from 'lucide-react';
import type { PYQ } from '../types';
import { subscribeToPublishedPYQs } from '../services/pyqs';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useAudio } from '../context/AudioContext';

interface PYQsPageProps {
  onBack?: () => void;
  onOpenPdf?: (url: string, title: string) => void;
}

export const PYQsPage: React.FC<PYQsPageProps> = ({ onBack, onOpenPdf }) => {
  const { playTap } = useAudio();
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToPublishedPYQs(data => {
      setPyqs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Unique exams for filtering
  const exams = Array.from(
    new Set(pyqs.map(p => p.exam).filter((e): e is string => Boolean(e)))
  );

  const filteredPyqs = pyqs.filter(p => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subject && p.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.exam && p.exam.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.year && String(p.year).includes(searchQuery.trim()));

    const matchesExam = !selectedExam || p.exam === selectedExam;

    return matchesSearch && matchesExam;
  });

  const handleOpenDoc = (pyq: PYQ) => {
    playTap();
    const targetUrl = pyq.pdfUrl || pyq.fileUrl;
    if (!targetUrl) return;

    if (onOpenPdf) {
      onOpenPdf(targetUrl, pyq.title);
    } else {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

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
              Previous Year Papers (PYQs)
            </h1>
            <p className="text-xs text-slate-500">
              Exam question papers with answer keys & solutions
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
          placeholder="Search by exam, year, or subject..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Exam Filter Chips */}
      {exams.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              playTap();
              setSelectedExam(null);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
              selectedExam === null
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Exams
          </button>
          {exams.map(exam => (
            <button
              key={exam}
              type="button"
              onClick={() => {
                playTap();
                setSelectedExam(prev => (prev === exam ? null : exam));
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                selectedExam === exam
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {exam}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <LoadingState message="Loading PYQ papers..." />
      ) : filteredPyqs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No PYQ Papers Found"
          description={
            searchQuery || selectedExam
              ? 'Try adjusting your search criteria.'
              : 'PYQ papers published in the Admin Web will appear here in real-time.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredPyqs.map(pyq => {
            const hasPdf = Boolean(pyq.pdfUrl || pyq.fileUrl);

            return (
              <div
                key={pyq.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {pyq.exam && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                          {pyq.exam}
                        </span>
                      )}
                      {pyq.year && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                          <Calendar className="w-3 h-3" />
                          <span>{pyq.year}</span>
                        </span>
                      )}
                      {pyq.subject && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {pyq.subject}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {pyq.title}
                    </h3>

                    {pyq.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {pyq.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    {pyq.totalMarks && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{pyq.totalMarks} Marks</span>
                      </span>
                    )}
                    {pyq.duration && <span>{pyq.duration} Mins</span>}
                  </div>

                  {hasPdf ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDoc(pyq)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View Paper</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Paper PDF coming soon</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
