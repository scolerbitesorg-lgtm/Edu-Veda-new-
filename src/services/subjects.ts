import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Subject } from '../types';

export function subscribeToPublishedSubjects(
  callback: (subjects: Subject[]) => void
): () => void {
  try {
    const q = query(collection(db, 'subjects'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Subject[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.published !== false) {
            list.push({
              id: docSnap.id,
              name: data.name || 'Subject',
              description: data.description,
              icon: data.icon,
              image: data.image,
              tag: data.tag,
              lessonCount: data.lessonCount,
              color: data.color,
              badge: data.badge,
              order: data.order ?? 0,
              published: data.published ?? true,
              ...data,
            });
          }
        });

        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.error('Error subscribing to subjects:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeToSubjectById(
  id: string,
  callback: (subject: Subject | null) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      doc(db, 'subjects', id),
      docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          if (data.published !== false) {
            callback({
              id: docSnap.id,
              name: data.name || 'Subject',
              description: data.description,
              icon: data.icon,
              image: data.image,
              tag: data.tag,
              lessonCount: data.lessonCount,
              color: data.color,
              badge: data.badge,
              order: data.order ?? 0,
              published: data.published ?? true,
              ...data,
            });
            return;
          }
        }
        callback(null);
      },
      error => {
        console.error('Error subscribing to subject by id:', error);
        callback(null);
      }
    );
    return unsubscribe;
  } catch {
    callback(null);
    return () => {};
  }
}

export async function fetchPublishedSubjects(): Promise<Subject[]> {
  try {
    const q = query(collection(db, 'subjects'));
    const snapshot = await getDocs(q);
    const list: Subject[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.published !== false) {
        list.push({
          id: docSnap.id,
          name: data.name || 'Subject',
          description: data.description,
          icon: data.icon,
          image: data.image,
          tag: data.tag,
          lessonCount: data.lessonCount,
          color: data.color,
          badge: data.badge,
          order: data.order ?? 0,
          published: data.published ?? true,
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching published subjects:', err);
    return [];
  }
}

export async function fetchSubjectById(id: string): Promise<Subject | null> {
  try {
    const snap = await getDoc(doc(db, 'subjects', id));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data.published !== false) {
        return {
          id: snap.id,
          name: data.name || 'Subject',
          description: data.description,
          icon: data.icon,
          image: data.image,
          tag: data.tag,
          lessonCount: data.lessonCount,
          color: data.color,
          badge: data.badge,
          order: data.order ?? 0,
          published: data.published ?? true,
          ...data,
        };
      }
    }
  } catch (err) {
    console.error('Error fetching subject by id:', err);
  }
  return null;
}
