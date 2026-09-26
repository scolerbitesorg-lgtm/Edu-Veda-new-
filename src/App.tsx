import React, { useState, useEffect, useCallback } from 'react';
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
import { TopicMCQPage } from './pages/TopicMCQPage';
import { TopicNotesListPage } from './pages/TopicNotesListPage';
import { TopicLecturesListPage } from './pages/TopicLecturesListPage';
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

export interface NavigationState {
  activePage: AppPage;
  selectedSubjectId: string | null;
  selectedTopicId: string | null;
  selectedTopicMcqId: string | null;
  selectedTopicNotesListId: string | null;
  selectedTopicLecturesListId: string | null;
  selectedLectureId: string | null;
  selectedNoteId: string | null;
  launchedTestId: string | null;
}

const defaultHomeState: NavigationState = {
  activePage: 'home',
  selectedSubjectId: null,
  selectedTopicId: null,
  selectedTopicMcqId: null,
  selectedTopicNotesListId: null,
  selectedTopicLecturesListId: null,
  selectedLectureId: null,
  selectedNoteId: null,
  launchedTestId: null,
};

const MainAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Navigation State with integrated Browser History Stack
  const [navState, setNavState] = useState<NavigationState>(() => {
    if (typeof window !== 'undefined' && window.history.state) {
      return {
        ...defaultHomeState,
        ...window.history.state,
      };
    }
    return defaultHomeState;
  });

  // App settings & maintenance
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Sync with browser history popstate event (hardware/browser back button)
  useEffect(() => {
    try {
      if (!window.history.state) {
        window.history.replaceState(defaultHomeState, '');
      }
    } catch {}

    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setNavState({
          ...defaultHomeState,
          ...event.state,
        });
      } else {
        setNavState(defaultHomeState);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate to a new screen while pushing into browser history
  const navigateTo = useCallback((changes: Partial<NavigationState>) => {
    setNavState((prev) => {
      const next: NavigationState = {
        ...prev,
        ...changes,
      };
      try {
        window.history.pushState(next, '');
      } catch {}
      return next;
    });
  }, []);

  // One-page back handler for both UI buttons and popstate triggers
  const handleGoBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback if accessed directly: step back logically without exiting
      setNavState((prev) => {
        if (prev.selectedNoteId) return { ...prev, selectedNoteId: null };
        if (prev.selectedLectureId) return { ...prev, selectedLectureId: null };
        if (prev.selectedTopicMcqId) return { ...prev, selectedTopicMcqId: null };
        if (prev.selectedTopicNotesListId) return { ...prev, selectedTopicNotesListId: null };
        if (prev.selectedTopicLecturesListId) return { ...prev, selectedTopicLecturesListId: null };
        if (prev.selectedTopicId) return { ...prev, selectedTopicId: null };
        if (prev.selectedSubjectId) return { ...prev, selectedSubjectId: null };
        if (prev.activePage !== 'home') return { ...prev, activePage: 'home' };
        return prev;
      });
    }
  }, []);

  // Real-time onSnapshot listener on 'app-config' document in Firestore
  useEffect(() => {
    let unsubDirect: (() => void) | null = null;
    try {
      unsubDirect = onSnapshot(
        doc(db, 'app-config', 'config'),
        (docSnap) => {
          if (docSnap.exists()) {
            setSettings((prev) => ({
              ...prev,
              ...(docSnap.data() as AppSettings),
            }));
          }
        },
        () => {}
      );
    } catch {}

    const unsubService = subscribeToAppConfig((liveConfig) => {
      setSettings((prev) => ({
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
    navigateTo({
      activePage: tab as AppPage,
      selectedSubjectId: null,
      selectedTopicId: null,
      selectedTopicMcqId: null,
      selectedTopicNotesListId: null,
      selectedTopicLecturesListId: null,
      selectedLectureId: null,
      selectedNoteId: null,
    });
  };

  // Switch page handler
  const handleNavigatePage = (page: string, _params?: any) => {
    navigateTo({
      activePage: page as AppPage,
      selectedSubjectId: null,
      selectedTopicId: null,
      selectedTopicMcqId: null,
      selectedTopicNotesListId: null,
      selectedTopicLecturesListId: null,
      selectedLectureId: null,
      selectedNoteId: null,
    });
  };

  // Search Result Selection Handler
  const handleSelectSearchResult = (
    type: 'subject' | 'topic' | 'lecture' | 'note' | 'pyq' | 'test',
    id: string,
    _context?: { subjectId?: string; topicId?: string }
  ) => {
    if (type === 'subject') {
      navigateTo({
        selectedSubjectId: id,
        selectedTopicId: null,
        selectedTopicMcqId: null,
        selectedTopicNotesListId: null,
        selectedTopicLecturesListId: null,
        selectedLectureId: null,
        selectedNoteId: null,
        activePage: 'home',
      });
    } else if (type === 'topic') {
      navigateTo({
        selectedTopicId: id,
        selectedTopicMcqId: null,
        selectedTopicNotesListId: null,
        selectedTopicLecturesListId: null,
        selectedLectureId: null,
        selectedNoteId: null,
        activePage: 'home',
      });
    } else if (type === 'lecture') {
      navigateTo({
        selectedLectureId: id,
        selectedNoteId: null,
        activePage: 'home',
      });
    } else if (type === 'note') {
      navigateTo({
        selectedNoteId: id,
      });
    } else if (type === 'test') {
      navigateTo({
        launchedTestId: id,
        activePage: 'test',
      });
    } else if (type === 'pyq') {
      navigateTo({
        activePage: 'pyqs',
      });
    }
  };

  // Launch mock test
  const handleStartTest = (test: MockTest) => {
    navigateTo({
      launchedTestId: test.id,
      activePage: 'test',
    });
  };

  // Check if dedicated full-screen immersion is active (no main header/bottom nav)
  const isDedicatedFullScreen =
    Boolean(navState.selectedTopicMcqId) ||
    Boolean(navState.selectedTopicNotesListId) ||
    Boolean(navState.selectedTopicLecturesListId) ||
    Boolean(navState.selectedNoteId) ||
    Boolean(navState.selectedLectureId) ||
    Boolean(navState.selectedTopicId) ||
    Boolean(navState.selectedSubjectId) ||
    navState.activePage === 'categories' ||
    navState.activePage === 'subjects' ||
    navState.activePage === 'pyqs' ||
    navState.activePage === 'mcqs' ||
    navState.activePage === 'results' ||
    navState.activePage === 'profile' ||
    navState.activePage === 'ai';

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
    return <AuthPage onSuccess={() => navigateTo({ activePage: 'home' })} />;
  }

  // Map activePage to bottom tab indicator
  const bottomNavTab: TabType =
    navState.activePage === 'notes'
      ? 'notes'
      : navState.activePage === 'test'
      ? 'test'
      : navState.activePage === 'ai'
      ? 'ai'
      : 'home';

  return (
    <div
      className={`min-h-screen ${
        navState.selectedLectureId ? 'bg-slate-950' : 'bg-[#F8F9FD]'
      } text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-800`}
    >
      {/* Optional Announcement Notice */}
      {!isDedicatedFullScreen && settings?.showBanner && settings?.bannerNotice && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-xs flex items-center justify-center gap-2 sticky top-0 z-50 animate-in fade-in duration-200">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          <span className="truncate max-w-sm sm:max-w-md">{settings.bannerNotice}</span>
        </div>
      )}

      {/* Top Header (Visible on standard root tabs) */}
      {!isDedicatedFullScreen && (
        <Header onOpenProfile={() => navigateTo({ activePage: 'profile' })} />
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto ${
          navState.selectedLectureId
            ? 'max-w-5xl'
            : isDedicatedFullScreen
            ? 'max-w-2xl'
            : 'max-w-md sm:max-w-xl'
        }`}
      >
        {/* 1. Note Viewer Page */}
        {navState.selectedNoteId ? (
          <NoteViewerPage
            noteId={navState.selectedNoteId}
            onBack={handleGoBack}
          />
        ) : navState.selectedLectureId ? (
          /* 2. Video Lecture Player */
          <VideoLecturePage
            lectureId={navState.selectedLectureId}
            onBack={handleGoBack}
            onSelectLecture={(id) => navigateTo({ selectedLectureId: id })}
          />
        ) : navState.selectedTopicMcqId ? (
          /* 3. Dedicated MCQ Quiz Page */
          <TopicMCQPage
            topicId={navState.selectedTopicMcqId}
            onBack={handleGoBack}
          />
        ) : navState.selectedTopicNotesListId ? (
          /* 4. Dedicated Topic Notes List */
          <TopicNotesListPage
            topicId={navState.selectedTopicNotesListId}
            onBack={handleGoBack}
            onSelectNote={(id) => navigateTo({ selectedNoteId: id })}
          />
        ) : navState.selectedTopicLecturesListId ? (
          /* 5. Dedicated Topic Lectures List */
          <TopicLecturesListPage
            topicId={navState.selectedTopicLecturesListId}
            onBack={handleGoBack}
            onSelectLecture={(id) => navigateTo({ selectedLectureId: id })}
          />
        ) : navState.selectedTopicId ? (
          /* 6. Study Unit Preview Hub */
          <TopicDetailPage
            topicId={navState.selectedTopicId}
            onBack={handleGoBack}
            onOpenMCQs={() => navigateTo({ selectedTopicMcqId: navState.selectedTopicId })}
            onOpenNotes={() => navigateTo({ selectedTopicNotesListId: navState.selectedTopicId })}
            onOpenLectures={() => navigateTo({ selectedTopicLecturesListId: navState.selectedTopicId })}
          />
        ) : navState.selectedSubjectId ? (
          /* 7. Subject Topics / Lessons List */
          <SubjectDetailPage
            subjectId={navState.selectedSubjectId}
            onBack={handleGoBack}
            onSelectTopic={(id) => navigateTo({ selectedTopicId: id })}
          />
        ) : (
          /* User App 10 Main Screens */
          <>
            {/* 1. Home */}
            {navState.activePage === 'home' && (
              <HomePage
                onSelectSubject={(id) => navigateTo({ selectedSubjectId: id })}
                onSelectTopic={(topicId, subjectId) => {
                  navigateTo({
                    selectedSubjectId: subjectId || null,
                    selectedTopicId: topicId,
                  });
                }}
                onSelectResult={handleSelectSearchResult}
                onNavigatePage={handleNavigatePage}
                onStartTest={handleStartTest}
              />
            )}

            {/* 2. Categories */}
            {navState.activePage === 'categories' && (
              <CategoriesPage
                onSelectSubject={(id) => navigateTo({ selectedSubjectId: id })}
                onBack={handleGoBack}
              />
            )}

            {/* 3. Subjects */}
            {navState.activePage === 'subjects' && (
              <SubjectsPage
                onSelectSubject={(id) => navigateTo({ selectedSubjectId: id })}
                onBack={handleGoBack}
              />
            )}

            {/* 4. Notes */}
            {navState.activePage === 'notes' && (
              <NotesPage
                onOpenNote={(id) => navigateTo({ selectedNoteId: id })}
                onSelectTopic={(topicId, subjectId) => {
                  navigateTo({
                    selectedSubjectId: subjectId || null,
                    selectedTopicId: topicId,
                  });
                }}
              />
            )}

            {/* 5. Mock Tests */}
            {navState.activePage === 'test' && (
              <TestPage
                initialTestId={navState.launchedTestId}
                onClearInitialTest={() => navigateTo({ launchedTestId: null })}
              />
            )}

            {/* 6. PYQs */}
            {navState.activePage === 'pyqs' && (
              <PYQsPage
                onBack={handleGoBack}
                onOpenPdf={(url, _title) => {
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
              />
            )}

            {/* 7. MCQ Practice */}
            {navState.activePage === 'mcqs' && (
              <MCQPracticePage
                onBack={handleGoBack}
              />
            )}

            {/* 8. Results */}
            {navState.activePage === 'results' && (
              <ResultsPage
                onBack={handleGoBack}
                onNavigateToTests={() => navigateTo({ activePage: 'test' })}
              />
            )}

            {/* 9. Profile / Settings */}
            {navState.activePage === 'profile' && (
              <ProfileSettingsPage
                onBack={handleGoBack}
              />
            )}

            {/* 10. Veda AI Study Assistant */}
            {navState.activePage === 'ai' && (
              <VedaAiPage onBack={handleGoBack} />
            )}
          </>
        )}
      </main>

      {/* Profile Modal fallback */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenNote={(id) => navigateTo({ selectedNoteId: id })}
      />

      {/* Fixed Mobile Bottom Navigation (Hidden on dedicated full-screen pages) */}
      {!isDedicatedFullScreen && (
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
