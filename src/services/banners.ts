import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Banner, AppSettings } from '../types';

export function subscribeToBanners(
  callback: (banners: Banner[]) => void,
  fallbackSettings?: AppSettings | null
): () => void {
  try {
    const q = query(collection(db, 'banners'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Banner[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.published !== false && data.status !== 'draft') {
            list.push({
              id: docSnap.id,
              title: data.title || '',
              subtitle: data.subtitle || '',
              image: data.image || '',
              buttonText: data.buttonText || 'Explore Now',
              buttonUrl: data.buttonUrl || '',
              buttonVisible: data.buttonVisible !== false,
              actionType: data.actionType || 'link',
              actionTargetId: data.actionTargetId,
              order: data.order ?? 0,
              published: true,
              ...data,
            });
          }
        });

        // If no items in banners collection, construct banner from AppSettings if present
        if (list.length === 0 && fallbackSettings?.bannerTitle) {
          list.push({
            id: 'default-app-banner',
            title: fallbackSettings.bannerTitle,
            subtitle: fallbackSettings.bannerSubtitle || fallbackSettings.subTitle,
            image: fallbackSettings.bannerImage || '',
            buttonText: fallbackSettings.bannerButtonText || 'Start Learning',
            buttonVisible: fallbackSettings.bannerButtonVisible !== false,
            actionType: 'link',
            order: 0,
            published: true,
          });
        }

        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to banners:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchBanners(): Promise<Banner[]> {
  try {
    const snapshot = await getDocs(collection(db, 'banners'));
    const list: Banner[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.published !== false && data.status !== 'draft') {
        list.push({
          id: docSnap.id,
          title: data.title || '',
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}
