import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { AppSettings } from '../types';
import { normalizeMultiAISettings } from '../utils/aiSettingsHelper';

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
 * List of Firestore document paths where the Admin Panel may store
 * general configurations or AI API key settings.
 */
const CONFIG_DOCS: [string, string][] = [
  ['appSettings', 'general'],
  ['appSettings', 'ai'],
  ['appSettings', 'aiSettings'],
  ['appSettings', 'vedaAi'],
  ['appSettings', 'veda-ai'],
  ['settings', 'global'],
  ['settings', 'general'],
  ['settings', 'ai'],
  ['settings', 'vedaAi'],
  ['app-config', 'config'],
  ['app-config', 'general'],
  ['app-config', 'ai'],
];

/**
 * Service to monitor real-time changes in Firestore across all admin configuration documents,
 * ensuring all global app settings, headings, descriptions, and AI API keys update instantly
 * when the admin modifies data in the admin panel.
 */
export function subscribeToAppConfig(callback: (settings: AppSettings) => void): () => void {
  // Fire immediately with cache for 0ms initial load
  callback(cachedSettings);

  const unsubscribers: (() => void)[] = [];

  const handleUpdate = (incomingData: Record<string, any>) => {
    const rawMerged = { ...cachedSettings, ...incomingData };
    // Automatically normalize and sync AI multi-providers whenever admin saves new keys
    const normalizedAI = normalizeMultiAISettings(rawMerged);
    const fullyMerged: AppSettings = {
      ...rawMerged,
      aiMultiProviders: normalizedAI,
    };

    cachedSettings = fullyMerged;
    try {
      localStorage.setItem('edu_app_config', JSON.stringify(fullyMerged));
    } catch {}
    callback(fullyMerged);
  };

  try {
    for (const [col, id] of CONFIG_DOCS) {
      const unsub = onSnapshot(
        doc(db, col, id),
        docSnap => {
          if (docSnap.exists()) {
            handleUpdate(docSnap.data() as Record<string, any>);
          }
        },
        () => {
          // Silent catch for missing or uninitialized documents
        }
      );
      unsubscribers.push(unsub);
    }
  } catch (err) {
    console.warn('[Config Service] Real-time config listener error:', err);
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
    const fetchPromises = CONFIG_DOCS.map(([col, id]) =>
      getDoc(doc(db, col, id))
        .then(snap => (snap.exists() ? snap.data() : null))
        .catch(() => null)
    );

    const results = await Promise.all(fetchPromises);

    let rawMerged: Record<string, any> = { ...defaultSettings };
    for (const data of results) {
      if (data && typeof data === 'object') {
        rawMerged = { ...rawMerged, ...data };
      }
    }

    // Process and normalize AI settings from all admin inputs
    const normalizedAI = normalizeMultiAISettings(rawMerged);
    const finalSettings: AppSettings = {
      ...rawMerged,
      aiMultiProviders: normalizedAI,
    };

    cachedSettings = finalSettings;
    try {
      localStorage.setItem('edu_app_config', JSON.stringify(finalSettings));
    } catch {}
    return finalSettings;
  } catch {}
  return cachedSettings;
}

export const fetchAppSettings = fetchAppConfig;
