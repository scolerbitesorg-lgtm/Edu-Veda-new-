import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Announcement } from '../types';

export function subscribeToAnnouncements(
  callback: (announcements: Announcement[]) => void
): () => void {
  try {
    const q = query(collection(db, 'announcements'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Announcement[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.published !== false && data.status !== 'draft') {
            list.push({
              id: docSnap.id,
              title: data.title || '',
              message: data.message || '',
              badge: data.badge || 'New',
              link: data.link,
              published: true,
              createdAt: data.createdAt,
              ...data,
            });
          }
        });
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to announcements:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}
