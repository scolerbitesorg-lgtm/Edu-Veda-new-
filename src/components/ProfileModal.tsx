import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Calendar,
  LogOut,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  TrendingUp,
  Award,
  BookOpen,
  Bookmark,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { fetchUserMockAttempts, fetchUserMCQAttempts } from '../services/attempts';
import { fetchUserProgress } from '../services/progress';
import { fetchPublishedSubjects } from '../services/subjects';
import { getBookmarkedQuestions, getSavedNotes, toggleBookmarkQuestion, toggleSaveNote } from '../services/bookmarks';
import type { MockAttempt, MCQAttempt, UserProgress, MCQ, Note } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNote?: (noteId: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onOpenNote }) => {
  const { user, profile, updateProfileData, updatePasswordData, logout } = useAuth();
  const { playTap, playSuccess } = useAudio();

  const [activeTab, setActiveTab] = useState<'analytics' | 'history' | 'saved' | 'account'>('analytics');

  // Edit profile state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(profile?.name || user?.displayName || '');
  const [mobile, setMobile] = useState<string>(profile?.mobile || '');

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Analytics data
  const [mockAttempts, setMockAttempts] = useState<MockAttempt[]>([]);
  const [mcqAttempts, setMcqAttempts] = useState<MCQAttempt[]>([]);
  const [progressList, setProgressList] = useState<UserProgress[]>([]);
  const [totalSubjectsCount, setTotalSubjectsCount] = useState<number>(0);
  const [bookmarkedQs, setBookmarkedQs] = useState<MCQ[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    setName(profile?.name || user?.displayName || '');
    setMobile(profile?.mobile || '');

    const loadUserData = async () => {
      try {
        const [mocks, mcqs, progress, subjects] = await Promise.all([
          fetchUserMockAttempts(user.uid),
          fetchUserMCQAttempts(user.uid),
          fetchUserProgress(user.uid),
          fetchPublishedSubjects(),
        ]);

        if (isMounted) {
          setMockAttempts(mocks);
          setMcqAttempts(mcqs);
          setProgressList(progress);
          setTotalSubjectsCount(subjects.length);
          setBookmarkedQs(getBookmarkedQuestions(user.uid));
          setSavedNotes(getSavedNotes(user.uid));
          setDataLoaded(true);
        }
      } catch (err) {
        console.warn('Could not load user analytics data:', err);
      }
    };

    loadUserData();

    const handleBookmarksChanged = () => {
      if (isMounted && user) {
        setBookmarkedQs(getBookmarkedQuestions(user.uid));
        setSavedNotes(getSavedNotes(user.uid));
      }
    };

    window.addEventListener('bookmarks_updated', handleBookmarksChanged);
    return () => {
      isMounted = false;
      window.removeEventListener('bookmarks_updated', handleBookmarksChanged);
    };
  }, [isOpen, user, profile]);

  if (!isOpen) return null;

  // Compute Aggregated Analytics
  let totalCorrect = 0;
  let totalAttempted = 0;

  mockAttempts.forEach(m => {
    totalCorrect += m.correct;
    totalAttempted += m.correct + m.wrong;
  });

  mcqAttempts.forEach(q => {
    totalCorrect += q.correct;
    totalAttempted += q.correct + q.wrong;
  });

  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const completedCount = progressList.filter(p => p.completed).length;
  // Estimate syllabus completion baseline
  const estimatedTotalLessons = Math.max(12, totalSubjectsCount * 4);
  const syllabusCompletion = Math.min(
    100,
    Math.round((completedCount / estimatedTotalLessons) * 100)
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playTap();
    setLoading(true);
    setMessage(null);
    try {
      await updateProfileData(name, mobile);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playTap();
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await updatePasswordData(newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Failed to update password. You may need to log in again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    playTap();
    await logout();
    onClose();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Active';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 relative max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playTap();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-10"
          aria-label="Close Profile"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Avatar & Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 shrink-0 pr-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-700 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-500/25 ring-2 ring-indigo-50 shrink-0">
            {profile?.name
              ? profile.name.charAt(0).toUpperCase()
              : user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base tracking-tight truncate">
              {profile?.name || user?.displayName || 'Edu Veda Student'}
            </h3>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                Verified Student
              </span>
              <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl my-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              playTap();
              setActiveTab('analytics');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => {
              playTap();
              setActiveTab('history');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tests ({mockAttempts.length})
          </button>
          <button
            type="button"
            onClick={() => {
              playTap();
              setActiveTab('saved');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'saved'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Saved ({bookmarkedQs.length + savedNotes.length})
          </button>
          <button
            type="button"
            onClick={() => {
              playTap();
              setActiveTab('account');
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'account'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Account
          </button>
        </div>

        {/* Tab Contents: Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: ANALYTICS & DASHBOARD */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Top Stats 3-Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100/60 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 block">Accuracy</span>
                  <span className="text-lg font-extrabold text-indigo-950">{overallAccuracy}%</span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100/60 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 block">Practiced</span>
                  <span className="text-lg font-extrabold text-purple-950">{totalAttempted} Qs</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100/60 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 block">Completed</span>
                  <span className="text-lg font-extrabold text-emerald-950">{completedCount}</span>
                </div>
              </div>

              {/* Syllabus Completion Bar */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Syllabus Completion</span>
                  <span className="font-bold text-indigo-600">{syllabusCompletion}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, syllabusCompletion)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  {completedCount} lessons completed out of curriculum target
                </p>
              </div>

              {/* Visual Performance Graph / Trend */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
                    Recent Test Performance Trend
                  </span>
                  <span className="text-[10px] text-slate-400">Last 5 Tests</span>
                </div>

                {mockAttempts.length > 0 ? (
                  <div className="pt-3 pb-1 flex items-end justify-between gap-2 h-24">
                    {mockAttempts.slice(0, 5).reverse().map((att, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[9px] font-bold text-indigo-700 font-mono">
                          {att.percentage}%
                        </span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-300"
                          style={{ height: `${Math.max(15, att.percentage)}%` }}
                        />
                        <span className="text-[9px] text-slate-400 truncate max-w-[48px]">
                          T{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Take mock tests to generate performance trends.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TEST ATTEMPTS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full-Length Mock Scorecards
              </h4>

              {mockAttempts.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-500">No mock tests attempted yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Attempt tests from the Test tab to track your rank.</p>
                </div>
              ) : (
                mockAttempts.map(att => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {att.mockTitle || 'Full Mock Test'}
                        </h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(att.createdAt)}</span>
                          <span>&bull;</span>
                          <span>{Math.round(att.timeTaken / 60)} mins</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-indigo-600 block">
                          {att.score} / {att.total}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {att.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px] text-center border-t border-slate-100 font-medium">
                      <span className="text-emerald-700">+{att.correct} Correct</span>
                      <span className="text-rose-600">-{att.wrong} Wrong</span>
                      <span className="text-amber-700">{att.skipped} Skipped</span>
                    </div>
                  </div>
                ))
              )}

              {/* MCQ Practice Summary */}
              {mcqAttempts.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Topic Quiz Practice ({mcqAttempts.length})
                  </h4>
                  <div className="space-y-2">
                    {mcqAttempts.slice(0, 5).map(qAtt => (
                      <div
                        key={qAtt.id}
                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 truncate">
                            {qAtt.topicTitle || 'Topic Practice Quiz'}
                          </p>
                          <span className="text-[10px] text-slate-400">{formatDate(qAtt.createdAt)}</span>
                        </div>
                        <span className="font-bold text-indigo-700 shrink-0">
                          {qAtt.score} / {qAtt.total} ({Math.round((qAtt.score / qAtt.total) * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOKMARKS & SAVED NOTES */}
          {activeTab === 'saved' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Saved Notes Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Saved Study Notes ({savedNotes.length})</span>
                </div>

                {savedNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                    No notes saved yet. Tap the bookmark icon on any note to save it here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedNotes.map(n => (
                      <div
                        key={n.id}
                        className="p-3 rounded-2xl border border-slate-100 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-200 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                          <span className="text-[10px] text-indigo-600 uppercase font-semibold">
                            {n.type === 'pdf' ? 'PDF Document' : 'Markdown Note'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onOpenNote && (
                            <button
                              type="button"
                              onClick={() => {
                                playTap();
                                onClose();
                                onOpenNote(n.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                            >
                              Open
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (user) {
                                toggleSaveNote(user.uid, n);
                                setSavedNotes(getSavedNotes(user.uid));
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bookmarked MCQs Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Bookmark className="w-3.5 h-3.5 text-purple-600" />
                  <span>Bookmarked Questions ({bookmarkedQs.length})</span>
                </div>

                {bookmarkedQs.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                    No questions bookmarked yet. Bookmark tricky questions to review here later.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {bookmarkedQs.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-3 rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {q.question}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (user) {
                                toggleBookmarkQuestion(user.uid, q);
                                setBookmarkedQs(getBookmarkedQuestions(user.uid));
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 shrink-0"
                            title="Remove bookmark"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {q.options && q.correctAnswer !== undefined && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <span className="font-bold">Correct: </span>
                            {q.options[q.correctAnswer]}
                          </div>
                        )}
                        {q.explanation && (
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT SETTINGS */}
          {activeTab === 'account' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Feedback Message */}
              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {!isEditing && !showPasswordChange ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">
                        {user?.email || 'student@eduveda.app'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Mobile Number</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {profile?.mobile || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-medium">Member Since</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {formatDate(profile?.createdAt || user?.metadata?.creationTime)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        playTap();
                        setIsEditing(true);
                        setMessage(null);
                      }}
                      className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-semibold text-xs hover:bg-indigo-50 transition-colors"
                    >
                      Edit Profile Info
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playTap();
                        setShowPasswordChange(true);
                        setMessage(null);
                      }}
                      className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => setMobile(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom: Logout Button */}
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
