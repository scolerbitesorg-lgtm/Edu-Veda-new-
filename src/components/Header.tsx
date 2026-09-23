import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { subscribeToAppSettings, defaultSettings } from '../services/settings';
import type { AppSettings } from '../types';

interface HeaderProps {
  onOpenProfile: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile }) => {
  const { user, profile } = useAuth();
  const { isMuted, toggleMute, playTap } = useAudio();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const unsub = subscribeToAppSettings(data => {
      setSettings(data);
    });
    return () => unsub();
  }, []);

  const appName = settings.appName || 'Edu Veda';
  const subTitle = settings.subTitle ?? 'Educational Platform';

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9FD]/95 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & Name - Real-time synchronized with Admin Panel */}
        <div className="flex items-center gap-2.5">
          {settings.logo ? (
            <img
              src={settings.logo}
              alt={appName}
              className="w-9 h-9 rounded-xl object-contain bg-white shadow-xs border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 ring-2 ring-white">
              <span className="font-extrabold text-sm tracking-tight">
                {appName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EV'}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-base text-slate-900 tracking-tight">
                {appName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-[200px]">
              {subTitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound / Mute Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleMute();
              if (isMuted) playTap();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white active:scale-95 transition-all"
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            title={isMuted ? 'Audio Muted' : 'Audio On'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Profile / Menu Access */}
          <button
            type="button"
            onClick={() => {
              playTap();
              onOpenProfile();
            }}
            className="flex items-center rounded-full hover:ring-2 hover:ring-indigo-300 active:scale-95 transition-all text-slate-700"
            aria-label="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-50 border border-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-xs shadow-xs">
              {profile?.name ? (
                profile.name.charAt(0).toUpperCase()
              ) : user?.email ? (
                user.email.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
