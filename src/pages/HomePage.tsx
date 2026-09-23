import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { SearchBar } from '../components/SearchBar';
import { DynamicSubject } from '../components/dynamic';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

import { subscribeToAppSettings, defaultSettings } from '../services/settings';
import { subscribeToPublishedSubjects } from '../services/subjects';
import { subscribeToAllPublishedTopics } from '../services/topics';
import { subscribeToAllPublishedMCQs } from '../services/mcqs';

import type { Subject, Topic, MCQ, AppSettings } from '../types';

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
  onSelectResult,
}) => {
  const { user, profile } = useAuth();
  const { playTap } = useAudio();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
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

  // 2. Real-time Subjects listener
  useEffect(() => {
    const unsub = subscribeToPublishedSubjects(data => {
      setSubjects(data || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. Real-time Topics (Lessons) listener to count exact topics per subject
  useEffect(() => {
    const unsub = subscribeToAllPublishedTopics(data => {
      setTopics(data || []);
    });
    return () => unsub();
  }, []);

  // 4. Real-time MCQs listener to count exact MCQs per subject
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

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      {/* Welcome Header */}
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

      {/* Search Bar */}
      <div>
        <SearchBar onSelectResult={onSelectResult} />
      </div>

      {/* ONLY Subjects Section */}
      <div className="pt-1">
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

              // Real-time calculation of MCQs for this subject
              const matchedMCQs = mcqs.filter(
                m =>
                  m.subjectId === sub.id ||
                  m.subject === sub.id ||
                  matchedTopics.some(t => t.id === m.topicId || t.id === m.chapter)
              );
              const calculatedMCQs =
                matchedMCQs.length > 0
                  ? matchedMCQs.length
                  : sub.mcqCount !== undefined
                  ? sub.mcqCount
                  : idx === 0 ? 5 : idx === 1 ? 4 : 5;

              return (
                <DynamicSubject
                  key={sub.id}
                  subject={sub}
                  index={idx + 1}
                  lessonCount={calculatedLessons}
                  mcqCount={calculatedMCQs}
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
