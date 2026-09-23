import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AudioProvider } from './context/AudioContext';
import { Header } from './components/Header';
import { BottomNavigation, type TabType } from './components/BottomNavigation';
import { ProfileModal } from './components/ProfileModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { LoadingState } from './components/LoadingState';

// Pages
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { VideoLecturePage } from './pages/VideoLecturePage';
import { NoteViewerPage } from './pages/NoteViewerPage';
import { NotesPage } from './pages/NotesPage';
import { TestPage } from './pages/TestPage';
import { PYQsPage } from './pages/PYQsPage';
import { MCQPracticePage } from './pages/MCQPracticePage';
import { ResultsPage } from './pages/ResultsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { VedaAiPage } from './pages/VedaAiPage';

// Settings
import { subscribeToAppConfig, defaultSettings } from './services/settings';
import type { AppSettings, MockTest } from './types';

export type AppPage =
  | 'home'
  | 'categories'
  | 'subjects'
  | 'notes'
  | 'test'
  | 'pyqs'
  | 'mcqs'
  | 'results'
  | 'profile'
  | 'ai';

const MainAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Navigation states
  const [activePage, setActivePage] = useState<AppPage>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [launchedTestId, setLaunchedTestId] = useState<string | null>(null);

  // App settings & maintenance
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Real-time onSnapshot listener on 'app-config' document in Firestore
  useEffect(() => {
    let unsubDirect: (() => void) | null = null;
    try {
      unsubDirect = onSnapshot(
        doc(db, 'app-config', 'config'),
        docSnap => {
          if (docSnap.exists()) {
            setSettings(prev => ({
              ...prev,
              ...(docSnap.data() as AppSettings),
            }));
          }
        },
        () => {}
      );
    } catch {}

    const unsubService = subscribeToAppConfig(liveConfig => {
      setSettings(prev => ({
        ...prev,
        ...liveConfig,
      }));
    });

    return () => {
      if (unsubDirect) unsubDirect();
      unsubService();
    };
  }, []);

  // Handle Tab Switch from bottom navigation
  const handleTabChange = (tab: TabType) => {
    setActivePage(tab as AppPage);
    setSelectedSubjectId(null);
    setSelectedTopicId(null);
    setSelectedLectureId(null);
    setSelectedNoteId(null);
  };

  // Switch page handler
  const handleNavigatePage = (page: string, _params?: any) => {
    setSelectedSubjectId(null);
    setSelectedTopicId(null);
    setSelectedLectureId(null);
    setSelectedNoteId(null);
    setActivePage(page as AppPage);
  };

  // Search Result Selection Handler
  const handleSelectSearchResult = (
    type: 'subject' | 'topic' | 'lecture' | 'note' | 'pyq' | 'test',
    id: string,
    _context?: { subjectId?: string; topicId?: string }
  ) => {
    if (type === 'subject') {
      setSelectedSubjectId(id);
      setSelectedTopicId(null);
      setSelectedLectureId(null);
      setSelectedNoteId(null);
      setActivePage('home');
    } else if (type === 'topic') {
      setSelectedTopicId(id);
      setSelectedLectureId(null);
      setSelectedNoteId(null);
      setActivePage('home');
    } else if (type === 'lecture') {
      setSelectedLectureId(id);
      setSelectedNoteId(null);
      setActivePage('home');
    } else if (type === 'note') {
      setSelectedNoteId(id);
    } else if (type === 'test') {
      setLaunchedTestId(id);
      setActivePage('test');
    } else if (type === 'pyq') {
      setActivePage('pyqs');
    }
  };

  // Launch mock test
  const handleStartTest = (test: MockTest) => {
    setLaunchedTestId(test.id);
    setActivePage('test');
  };

  // Global loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState variant="full" message="Connecting to Edu Veda..." />
      </div>
    );
  }

  // Maintenance mode screen
  if (settings?.maintenanceMode) {
    return <MaintenanceScreen settings={settings} />;
  }

  // Not authenticated
  if (!user) {
    return <AuthPage onSuccess={() => setActivePage('home')} />;
  }

  // Map activePage to bottom tab indicator
  const bottomNavTab: TabType =
    activePage === 'notes'
      ? 'notes'
      : activePage === 'test'
      ? 'test'
      : activePage === 'ai'
      ? 'ai'
      : 'home';

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800">
      {/* Optional Announcement Notice */}
      {activePage !== 'ai' && settings?.showBanner && settings?.bannerNotice && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-xs flex items-center justify-center gap-2 sticky top-0 z-50 animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          <span className="truncate max-w-sm sm:max-w-md">{settings.bannerNotice}</span>
        </div>
      )}

      {/* Top Header */}
      {activePage !== 'ai' && (
        <Header
          onOpenProfile={() => setActivePage('profile')}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${selectedLectureId ? 'max-w-4xl' : 'max-w-md'}`}>
        {/* Dedicated Standalone Reader: Note Viewer Page */}
        {selectedNoteId ? (
          <NoteViewerPage
            noteId={selectedNoteId}
            onBack={() => setSelectedNoteId(null)}
          />
        ) : selectedLectureId ? (
          /* Deep Link: Video Lecture Player */
          <VideoLecturePage
            lectureId={selectedLectureId}
            onBack={() => setSelectedLectureId(null)}
            onSelectLecture={id => setSelectedLectureId(id)}
          />
        ) : selectedTopicId ? (
          /* Deep Link: Topic Detail Hub (Lectures, Notes, MCQs) */
          <TopicDetailPage
            topicId={selectedTopicId}
            onBack={() => setSelectedTopicId(null)}
            onSelectLecture={id => setSelectedLectureId(id)}
            onSelectNote={id => setSelectedNoteId(id)}
          />
        ) : selectedSubjectId ? (
          /* Deep Link: Subject Topics / Lessons List */
          <SubjectDetailPage
            subjectId={selectedSubjectId}
            onBack={() => setSelectedSubjectId(null)}
            onSelectTopic={id => setSelectedTopicId(id)}
          />
        ) : (
          /* User App 10 Main Pages */
          <>
            {/* 1. Home */}
            {activePage === 'home' && (
              <HomePage
                onSelectSubject={id => setSelectedSubjectId(id)}
                onSelectTopic={(topicId, subjectId) => {
                  if (subjectId) setSelectedSubjectId(subjectId);
                  setSelectedTopicId(topicId);
                }}
                onSelectResult={handleSelectSearchResult}
                onNavigatePage={handleNavigatePage}
                onStartTest={handleStartTest}
              />
            )}

            {/* 2. Categories */}
            {activePage === 'categories' && (
              <CategoriesPage
                onSelectSubject={id => {
                  setSelectedSubjectId(id);
                }}
                onBack={() => setActivePage('home')}
              />
            )}

            {/* 3. Subjects */}
            {activePage === 'subjects' && (
              <SubjectsPage
                onSelectSubject={id => {
                  setSelectedSubjectId(id);
                }}
                onBack={() => setActivePage('home')}
              />
            )}

            {/* 4. Notes */}
            {activePage === 'notes' && (
              <NotesPage
                onOpenNote={id => setSelectedNoteId(id)}
                onSelectTopic={(topicId, subjectId) => {
                  if (subjectId) setSelectedSubjectId(subjectId);
                  setSelectedTopicId(topicId);
                }}
              />
            )}

            {/* 5. Mock Tests */}
            {activePage === 'test' && (
              <TestPage
                initialTestId={launchedTestId}
                onClearInitialTest={() => setLaunchedTestId(null)}
              />
            )}

            {/* 6. PYQs */}
            {activePage === 'pyqs' && (
              <PYQsPage
                onBack={() => setActivePage('home')}
                onOpenPdf={(url, title) => {
                  // If it has a URL, can open in note viewer or browser
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              />
            )}

            {/* 7. MCQ Practice */}
            {activePage === 'mcqs' && (
              <MCQPracticePage
                onBack={() => setActivePage('home')}
              />
            )}

            {/* 8. Results */}
            {activePage === 'results' && (
              <ResultsPage
                onBack={() => setActivePage('home')}
                onNavigateToTests={() => setActivePage('test')}
              />
            )}

            {/* 9. Profile / Settings */}
            {activePage === 'profile' && (
              <ProfileSettingsPage
                onBack={() => setActivePage('home')}
              />
            )}

            {/* 10. Veda AI Study Assistant */}
            {activePage === 'ai' && (
              <VedaAiPage onBack={() => setActivePage('home')} />
            )}
          </>
        )}
      </main>

      {/* Profile Modal fallback */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenNote={id => setSelectedNoteId(id)}
      />

      {/* Fixed Mobile Bottom Navigation */}
      {activePage !== 'ai' && (
        <BottomNavigation
          currentTab={bottomNavTab}
          onChangeTab={handleTabChange}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <MainAppContent />
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
