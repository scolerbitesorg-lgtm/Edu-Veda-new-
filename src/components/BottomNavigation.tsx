import React from 'react';
import { Home, BookOpen, ClipboardList, Sparkles } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

export type TabType = 'home' | 'notes' | 'test' | 'ai';

interface BottomNavigationProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentTab, onChangeTab }) => {
  const { playTap } = useAudio();

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'test', label: 'Tests', icon: ClipboardList },
    { id: 'ai', label: 'Veda AI', icon: Sparkles },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playTap();
                onChangeTab(item.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 select-none min-h-[48px] ${
                isActive
                  ? 'text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
              aria-selected={isActive}
              role="tab"
            >
              <div
                className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-indigo-50 text-indigo-600 scale-105' : 'text-slate-400'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
