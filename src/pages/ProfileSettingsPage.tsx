import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Volume2,
  VolumeX,
  LogOut,
  ArrowLeft,
  Edit3,
  CheckCircle2,
  Lock,
  X,
  Shield,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { subscribeToAppSettings, defaultSettings } from '../services/settings';
import type { AppSettings } from '../types';

interface ProfileSettingsPageProps {
  onBack?: () => void;
  onOpenAdminPrompt?: () => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  onBack,
}) => {
  const { user, profile, logout, updateProfileData, updatePasswordData } = useAuth();
  const { soundEnabled, toggleSound, playTap, playSuccess } = useAudio();

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Edit Form State
  const [editName, setEditName] = useState<string>('');
  const [editMobile, setEditMobile] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAppSettings(data => {
      setSettings(data);
    });
    return () => unsub();
  }, []);

  const studentName =
    profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Student Learner';
  const studentEmail = profile?.email || user?.email || 'Not provided';
  const role = profile?.role || 'user';

  const handleOpenEditModal = () => {
    playTap();
    setEditName(studentName);
    setEditMobile(profile?.mobile || '');
    setNewPassword('');
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setSaveErrorMessage('Please enter your full name.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      // 1. Update name & mobile
      await updateProfileData(editName.trim(), editMobile.trim());

      // 2. If password was entered, update password
      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await updatePasswordData(newPassword.trim());
      }

      playSuccess();
      setSaveSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setSaveErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
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
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Profile & Settings
            </h1>
            <p className="text-xs text-slate-500">
              Manage your student profile & preferences
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card with Edit Button */}
      <div className="p-4.5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
            {studentName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {studentName}
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  role === 'admin'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                {role}
              </span>
            </div>

            <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{studentEmail}</span>
            </p>

            {profile?.mobile ? (
              <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{profile.mobile}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-0.5 italic flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-300 shrink-0" />
                <span>No phone number added</span>
              </p>
            )}
          </div>
        </div>

        {/* Edit Profile Action Button */}
        <button
          type="button"
          onClick={handleOpenEditModal}
          className="w-full py-2.5 px-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-indigo-100 active:scale-98"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile Details</span>
        </button>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs">
        {/* Sound Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Interactive Sound FX
              </p>
              <p className="text-[11px] text-slate-400">
                Audio cues for correct answers & clicks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              soundEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
            aria-label="Toggle sound fx"
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                soundEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Support & Admin Details from Firestore Settings */}
      <div className="p-4.5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Institution & Support
        </h3>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Platform:</span>
          <span className="font-bold text-slate-900">{settings.appName || 'Edu Veda'}</span>
        </div>

        {settings.supportEmail && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Support Desk:</span>
            <a
              href={`mailto:${settings.supportEmail}`}
              className="font-bold text-indigo-600 hover:underline"
            >
              {settings.supportEmail}
            </a>
          </div>
        )}

        {settings.supportPhone && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Helpline:</span>
            <a
              href={`tel:${settings.supportPhone}`}
              className="font-bold text-indigo-600 hover:underline"
            >
              {settings.supportPhone}
            </a>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-500">App Version:</span>
          <span className="font-semibold text-slate-400">v{settings.version || '1.0.0'}</span>
        </div>
      </div>

      {/* Logout button */}
      {user && (
        <button
          type="button"
          onClick={() => {
            playTap();
            logout();
          }}
          className="w-full py-3 px-4 rounded-2xl bg-rose-50 border border-rose-200/60 text-rose-700 text-xs sm:text-sm font-bold hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Device</span>
        </button>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Profile</h3>
                  <p className="text-[10px] text-slate-500">Update your student information</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveErrorMessage && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {saveErrorMessage}
              </div>
            )}

            {saveSuccessMessage && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address (Registered)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={studentEmail}
                    className="w-full bg-slate-100 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-500 cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={e => setEditMobile(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* New Password (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Change Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowEditModal(false)}
                  className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
