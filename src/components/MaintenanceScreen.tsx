import React from 'react';
import { Wrench, ShieldCheck, Mail, Phone } from 'lucide-react';
import type { AppSettings } from '../types';

interface MaintenanceScreenProps {
  settings: AppSettings;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ settings }) => {
  const appName = settings.appName || 'Edu Veda';
  const message =
    settings.maintenanceMessage ||
    'We are upgrading our servers and syllabus content to provide an even better learning experience. Please check back shortly.';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none">
      {settings.logo ? (
        <div className="w-20 h-20 rounded-3xl overflow-hidden mb-6 shadow-md border border-slate-200 bg-white p-2">
          <img src={settings.logo} alt={appName} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm ring-8 ring-indigo-50/50">
          <Wrench className="w-10 h-10 animate-bounce" />
        </div>
      )}

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
        <ShieldCheck className="w-4 h-4" />
        <span>System Maintenance</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        {appName} is Under Maintenance
      </h1>

      <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed whitespace-pre-line">
        {message}
      </p>

      {(settings.supportEmail || settings.supportPhone) && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 max-w-xs w-full shadow-sm text-left">
          <p className="text-xs font-semibold text-slate-800 mb-2">Need help? Contact support:</p>
          {settings.supportEmail && (
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1.5">
              <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{settings.supportEmail}</span>
            </div>
          )}
          {settings.supportPhone && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{settings.supportPhone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
