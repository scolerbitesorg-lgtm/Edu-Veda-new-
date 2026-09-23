import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'card-skeleton' | 'full' | 'inline';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  variant = 'spinner',
}) => {
  if (variant === 'card-skeleton') {
    return (
      <div className="space-y-3 p-4 animate-pulse">
        <div className="h-28 bg-slate-200/70 rounded-2xl w-full" />
        <div className="h-28 bg-slate-200/70 rounded-2xl w-full" />
        <div className="h-28 bg-slate-200/70 rounded-2xl w-full" />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-600">{message}</p>
        <span className="text-xs text-slate-400 mt-1">Please wait a moment...</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs font-medium text-slate-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};
