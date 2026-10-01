import React, { useEffect, useState } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { SearchBar } from '../components/SearchBar';
import { DynamicSubject } from '../components/dynamic/DynamicSubject';
import { DynamicBanner } from '../components/dynamic/DynamicBanner';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

import { subscribeToAppSettings, defaultSettings } from '../services/settings';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { subscribeToAllPublishedTopics } from '../services/topics';
import { subscribeToAllPublishedMCQs } from '../services/mcqs';
import { subscribeToBanners } from '../services/banners';

import type { Subject, Topic, MCQ, AppSettings, Banner } from '../types';

interface HomePageProps {
  onSelectSubject: (subjectId: string) => void;
  onSelectTopic?: (topicId: string, subjectId?: string) => void;
  onSelectResult: (
    type: 'subject' | 'topic' | 'lecture' | 'note' | 'pyq' | 'test',
    id: string,
    context?: { subjectId?: string; topicId?: string }
  ) => void;
  onNavigatePage?: (page: string, params?: any) => void;
  onStartTest?: (test: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectSubject,
  onSelectTopic,
  onSelectResult,
  onNavigatePage,
}) => {
  const { user, profile } = useAuth();
  const { playTap } = useAudio();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Settings listener
  useEffect(() => {
    const unsub = subscribeToAppSettings(data => {
      setSettings(data);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Banners listener
  useEffect(() => {
    const unsub = subscribeToBanners(data => {
      setBanners(data || []);
    }, settings);
    return () => unsub();
  }, [settings]);

  // 3. Real-time Subjects listener
  useEffect(() => {
    const unsub = subscribeToPublishedSubjects(data => {
      setSubjects(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 4. Real-time Topics (Lessons) listener to count exact topics per subject
  useEffect(() => {
    const unsub = subscribeToAllPublishedTopics(data => {
      setTopics(data || []);
    });
    return () => unsub();
  }, []);

  // 5. Real-time MCQs listener
  useEffect(() => {
    const unsub = subscribeToAllPublishedMCQs(data => {
      setMcqs(data || []);
    });
    return () => unsub();
  }, []);

  // Student greeting
  const studentName =
    profile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  const welcomeHeading = settings.welcomeHeading || 'Welcome back,';
  const welcomeSubtext =
    settings.welcomeSubtext ||
    'Select a subject to open syllabus, video lectures, and notes.';

  const handleBannerAction = (banner: Banner) => {
    playTap();
    if (banner.actionTargetId) {
      if (banner.actionType === 'topic' && onSelectTopic) {
        onSelectTopic(banner.actionTargetId);
        return;
      }
      onSelectSubject(banner.actionTargetId);
      return;
    }

    const url = banner.buttonUrl || banner.url || banner.link || '';
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (banner.actionType === 'test' || url.includes('test')) {
      onNavigatePage?.('test');
    } else if (banner.actionType === 'notes' || url.includes('notes')) {
      onNavigatePage?.('notes');
    } else if (banner.actionType === 'pyqs' || url.includes('pyqs')) {
      onNavigatePage?.('pyqs');
    } else if (banner.actionType === 'ai' || url.includes('ai')) {
      onNavigatePage?.('ai');
    } else if (banner.actionType === 'subjects' || url.includes('subjects')) {
      onNavigatePage?.('subjects');
    } else if (subjects.length > 0) {
      onSelectSubject(subjects[0].id);
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* 1. Welcome Greeting Header */}
      <div>
        <p className="text-xs font-bold text-indigo-600/90 uppercase tracking-wider">
          {welcomeHeading}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
          {studentName} 👋
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {welcomeSubtext}
        </p>
      </div>

      {/* 2. Search Bar */}
      <div>
        <SearchBar onSelectResult={onSelectResult} />
      </div>

      {/* 3. Hero Banner Carousel / Promotional Banner */}
      {banners.length > 0 && (
        <div className="pt-1">
          <DynamicBanner banners={banners} onAction={handleBannerAction} />
        </div>
      )}

      {/* 4. Academic Subjects Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Academic Subjects</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Syllabus lessons, video lectures & practice MCQs
            </p>
          </div>

          {subjects.length > 3 && (
            <button
              type="button"
              onClick={() => {
                playTap();
                onNavigatePage?.('subjects');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View All ({subjects.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingState variant="inline" message="Loading subjects..." />
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No Subjects Available"
            description="Subjects are being updated by your educators. Please check back shortly."
            icon={BookOpen}
          />
        ) : (
          <div className="space-y-3.5">
            {subjects.map((sub, idx) => {
              // Real-time calculation of topics/lessons for this subject
              const matchedTopics = topics.filter(t => t.subjectId === sub.id);
              const calculatedLessons =
                matchedTopics.length > 0
                  ? matchedTopics.length
                  : sub.lessonCount !== undefined
                  ? sub.lessonCount
                  : 0;

              return (
                <DynamicSubject
                  key={sub.id}
                  subject={sub}
                  index={idx + 1}
                  lessonCount={calculatedLessons}
                  onClick={() => {
                    playTap();
                    onSelectSubject(sub.id);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

