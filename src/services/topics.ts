import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Topic } from '../types';

export function subscribeToTopicsBySubject(
  subjectId: string,
  callback: (topics: Topic[]) => void
): () => void {
  try {
    const q = query(collection(db, 'topics'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Topic[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.subjectId === subjectId && data.published !== false) {
            list.push({
              id: docSnap.id,
              subjectId: data.subjectId || subjectId,
              title: data.title || 'Lesson Topic',
              description: data.description,
              order: data.order ?? 0,
              published: data.published ?? true,
              badge: data.badge,
              ...data,
            });
          }
        });

        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.error('Error subscribing to topics by subject:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeToTopicById(
  id: string,
  callback: (topic: Topic | null) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      doc(db, 'topics', id),
      docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          if (data.published !== false) {
            callback({
              id: docSnap.id,
              subjectId: data.subjectId || '',
              title: data.title || 'Lesson Topic',
              description: data.description,
              order: data.order ?? 0,
              published: data.published ?? true,
              badge: data.badge,
              ...data,
            });
            return;
          }
        }
        callback(null);
      },
      error => {
        console.error('Error subscribing to topic by id:', error);
        callback(null);
      }
    );
    return unsubscribe;
  } catch {
    callback(null);
    return () => {};
  }
}

export function subscribeToAllPublishedTopics(
  callback: (topics: Topic[]) => void
): () => void {
  try {
    const q = query(collection(db, 'topics'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Topic[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.published !== false) {
            list.push({
              id: docSnap.id,
              subjectId: data.subjectId || '',
              title: data.title || 'Lesson Topic',
              description: data.description,
              order: data.order ?? 0,
              published: data.published ?? true,
              badge: data.badge,
              ...data,
            });
          }
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.error('Error subscribing to all topics:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchTopicsBySubject(subjectId: string): Promise<Topic[]> {
  try {
    const q = query(collection(db, 'topics'));
    const snapshot = await getDocs(q);
    const list: Topic[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.subjectId === subjectId && data.published !== false) {
        list.push({
          id: docSnap.id,
          subjectId: data.subjectId || subjectId,
          title: data.title || 'Lesson Topic',
          description: data.description,
          order: data.order ?? 0,
          published: data.published ?? true,
          badge: data.badge,
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching topics by subject:', err);
    return [];
  }
}

export async function fetchTopicById(id: string): Promise<Topic | null> {
  try {
    const snap = await getDoc(doc(db, 'topics', id));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data.published !== false) {
        return {
          id: snap.id,
          subjectId: data.subjectId || '',
          title: data.title || 'Lesson Topic',
          description: data.description,
          order: data.order ?? 0,
          published: data.published ?? true,
          badge: data.badge,
          ...data,
        };
      }
    }
  } catch (err) {
    console.error('Error fetching topic by id:', err);
  }
  return null;
}

export async function fetchAllPublishedTopics(): Promise<Topic[]> {
  try {
    const q = query(collection(db, 'topics'));
    const snapshot = await getDocs(q);
    const list: Topic[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.published !== false) {
        list.push({
          id: docSnap.id,
          subjectId: data.subjectId || '',
          title: data.title || 'Lesson Topic',
          description: data.description,
          order: data.order ?? 0,
          published: data.published ?? true,
          badge: data.badge,
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching all published topics:', err);
    return [];
  }
}
