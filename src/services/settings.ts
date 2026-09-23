import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppSettings } from '../types';

export const defaultSettings: AppSettings = {
  appName: 'Edu Veda',
  hindiName: '',
  subTitle: 'Dedicated Learning Platform',
  welcomeHeading: 'Welcome back,',
  welcomeSubtext: 'Select a subject folder below to open syllabus, lessons, and notes.',
  supportEmail: 'support@eduveda.app',
  themeColor: '#4f46e5',
  maintenanceMode: false,
  announcement: '',
  version: '1.0.0',
};

// Global in-memory cache for instant 0ms reading
let cachedSettings: AppSettings = { ...defaultSettings };
try {
  const local = localStorage.getItem('edu_app_config');
  if (local) {
    cachedSettings = { ...defaultSettings, ...JSON.parse(local) };
  }
} catch {}

/**
 * Service to monitor real-time changes in Firestore for 'app-config' and 'appSettings' documents,
 * ensuring all global app settings, headings, descriptions, and content strings update instantly
 * when the admin changes data in the admin panel.
 */
export function subscribeToAppConfig(callback: (settings: AppSettings) => void): () => void {
  // Fire immediately with cache for 0ms initial load
  callback(cachedSettings);

  const unsubscribers: (() => void)[] = [];

  const handleUpdate = (incomingData: Partial<AppSettings>) => {
    cachedSettings = { ...cachedSettings, ...incomingData };
    try {
      localStorage.setItem('edu_app_config', JSON.stringify(cachedSettings));
    } catch {}
    callback(cachedSettings);
  };

  try {
    // 1. Primary listener on 'appSettings/general' (Admin panel primary config doc)
    const unsub1 = onSnapshot(
      doc(db, 'appSettings', 'general'),
      docSnap => {
        if (docSnap.exists()) {
          handleUpdate(docSnap.data() as AppSettings);
        }
      },
      () => {}
    );
    unsubscribers.push(unsub1);

    // 2. Fallback listener on 'app-config/config'
    const unsub2 = onSnapshot(
      doc(db, 'app-config', 'config'),
      docSnap => {
        if (docSnap.exists()) {
          handleUpdate(docSnap.data() as AppSettings);
        }
      },
      () => {}
    );
    unsubscribers.push(unsub2);

    // 3. Fallback listener on 'app-config/general'
    const unsub3 = onSnapshot(
      doc(db, 'app-config', 'general'),
      docSnap => {
        if (docSnap.exists()) {
          handleUpdate(docSnap.data() as AppSettings);
        }
      },
      () => {}
    );
    unsubscribers.push(unsub3);

    // 4. Fallback listener on 'settings/global'
    const unsub4 = onSnapshot(
      doc(db, 'settings', 'global'),
      docSnap => {
        if (docSnap.exists()) {
          handleUpdate(docSnap.data() as AppSettings);
        }
      },
      () => {}
    );
    unsubscribers.push(unsub4);
  } catch (err) {
    console.warn('Real-time config listener error:', err);
  }

  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
  };
}

export const subscribeToAppSettings = subscribeToAppConfig;

export async function fetchAppConfig(): Promise<AppSettings> {
  try {
    const [snap1, snap2, snap3] = await Promise.all([
      getDoc(doc(db, 'app-config', 'config')).catch(() => null),
      getDoc(doc(db, 'app-config', 'general')).catch(() => null),
      getDoc(doc(db, 'appSettings', 'general')).catch(() => null),
    ]);

    let merged = { ...defaultSettings };
    if (snap3 && snap3.exists()) merged = { ...merged, ...(snap3.data() as AppSettings) };
    if (snap2 && snap2.exists()) merged = { ...merged, ...(snap2.data() as AppSettings) };
    if (snap1 && snap1.exists()) merged = { ...merged, ...(snap1.data() as AppSettings) };

    cachedSettings = merged;
    try {
      localStorage.setItem('edu_app_config', JSON.stringify(merged));
    } catch {}
    return merged;
  } catch {}
  return cachedSettings;
}

export const fetchAppSettings = fetchAppConfig;
