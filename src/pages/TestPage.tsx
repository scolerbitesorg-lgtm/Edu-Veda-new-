import React, { useEffect, useState } from 'react';
import {
  Award,
  History,
} from 'lucide-react';
import { MockTestCard } from '../components/MockTestCard';
import { MockTestViewer } from '../components/MockTestViewer';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { subscribeToPublishedMockTests, fetchMockTestWithQuestions } from '../services/mockTests';
import { subscribeToUserMockAttempts, fetchUserMockAttempts } from '../services/attempts';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import type { MockTest, MockAttempt } from '../types';

interface TestPageProps {
  initialTestId?: string | null;
  onClearInitialTest?: () => void;
}

export const TestPage: React.FC<TestPageProps> = ({
  initialTestId,
  onClearInitialTest,
}) => {
  const { user } = useAuth();
  const { playTap } = useAudio();

  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [tests, setTests] = useState<MockTest[]>([]);
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active mock test and selected negative marking
  const [activeMockTest, setActiveMockTest] = useState<MockTest | null>(null);
  const [selectedPenalty, setSelectedPenalty] = useState<number | undefined>(undefined);
  const [loadingTest, setLoadingTest] = useState<boolean>(false);

  // Real-time synchronization directly from Firestore
  useEffect(() => {
    const unsubTests = subscribeToPublishedMockTests(mockList => {
      setTests(mockList || []);
      setLoading(false);
    });

    let unsubAttempts = () => {};
    if (user) {
      unsubAttempts = subscribeToUserMockAttempts(user.uid, attList => {
        if (attList) setAttempts(attList);
      });
    }

    return () => {
      unsubTests();
      unsubAttempts();
    };
  }, [user]);

  // If an initial test ID was provided, automatically trigger start
  useEffect(() => {
    if (initialTestId) {
      handleStartTest(initialTestId);
      onClearInitialTest?.();
    }
  }, [initialTestId]);

  const handleStartTest = async (testId: string, customPenalty?: number) => {
    playTap();
    setLoadingTest(true);
    setSelectedPenalty(customPenalty);
    try {
      const testWithQuestions = await fetchMockTestWithQuestions(testId);
      if (testWithQuestions) {
        setActiveMockTest(testWithQuestions);
      }
    } catch (e) {
      console.error('Failed to start test:', e);
    } finally {
      setLoadingTest(false);
    }
  };

  const handleFinishTest = () => {
    setActiveMockTest(null);
    setSelectedPenalty(undefined);
    if (user) {
      fetchUserMockAttempts(user.uid).then(attList => {
        if (attList) setAttempts(attList);
      });
    }
  };

  if (activeMockTest) {
    return (
      <div className="max-w-md mx-auto px-4 pt-2 pb-24">
        <MockTestViewer
          mockTest={activeMockTest}
          questions={activeMockTest.questions || []}
          onExit={handleFinishTest}
          customNegativeMarking={selectedPenalty}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-3">
      <div className="pt-1">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Mock Exams & Assessments
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Select any test and configure your custom negative marking scheme.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            playTap();
            setActiveTab('available');
          }}
          className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'available'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Available Tests ({tests.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playTap();
            setActiveTab('history');
          }}
          className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Attempt History ({attempts.length})</span>
        </button>
      </div>

      {loadingTest && <LoadingState variant="full" message="Preparing exam session..." />}

      {!loadingTest && (
        <>
          {activeTab === 'available' && (
            <div className="space-y-3 pt-1">
              {loading ? (
                <div className="py-12">
                  <LoadingState variant="inline" message="Loading tests..." />
                </div>
              ) : tests.length === 0 ? (
                <EmptyState
                  title="No Tests Available"
                  description="No mock tests are published in the database yet. When tests are created, they will appear here."
                  icon={Award}
                />
              ) : (
                tests.map(test => (
                  <MockTestCard
                    key={test.id}
                    test={test}
                    onStart={penalty => handleStartTest(test.id, penalty)}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3 pt-1">
              {attempts.length === 0 ? (
                <EmptyState
                  title="No Attempts Recorded"
                  description="Complete a mock test above to view your score analytics and performance."
                  icon={History}
                />
              ) : (
                attempts.map(attempt => (
                  <div
                    key={attempt.id}
                    className="bg-white rounded-2xl p-4.5 border border-slate-200/70 shadow-[0_2px_10px_rgba(0,0,0,0.03)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {attempt.mockTitle || 'Mock Assessment'}
                      </h3>
                      <span
                        className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                          attempt.percentage >= 70
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : attempt.percentage >= 40
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {attempt.percentage}% Score
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Correct</span>
                        <span className="text-xs font-bold text-emerald-600">{attempt.correct}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Wrong</span>
                        <span className="text-xs font-bold text-rose-600">{attempt.wrong}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total</span>
                        <span className="text-xs font-bold text-slate-700">{attempt.total} Qs</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
