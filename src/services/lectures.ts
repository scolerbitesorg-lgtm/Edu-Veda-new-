import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Lecture } from '../types';

export function subscribeToLecturesByTopic(
  topicId: string,
  callback: (lectures: Lecture[]) => void
): () => void {
  try {
    const q = query(collection(db, 'lectures'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Lecture[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.topicId === topicId && data.published !== false) {
            list.push({
              id: docSnap.id,
              subjectId: data.subjectId || '',
              topicId: data.topicId || topicId,
              title: data.title || 'Video Lecture',
              description: data.description,
              storagePath: data.storagePath || data.videoUrl || '',
              videoUrl: data.videoUrl,
              thumbnail: data.thumbnail,
              duration: data.duration,
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
        console.error('Error subscribing to lectures by topic:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchLecturesByTopic(topicId: string): Promise<Lecture[]> {
  try {
    const q = query(collection(db, 'lectures'));
    const snapshot = await getDocs(q);
    const list: Lecture[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.topicId === topicId && data.published !== false) {
        list.push({
          id: docSnap.id,
          subjectId: data.subjectId || '',
          topicId: data.topicId || topicId,
          title: data.title || 'Video Lecture',
          description: data.description,
          storagePath: data.storagePath || data.videoUrl || '',
          videoUrl: data.videoUrl,
          thumbnail: data.thumbnail,
          duration: data.duration,
          order: data.order ?? 0,
          published: data.published ?? true,
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching lectures by topic:', err);
    return [];
  }
}

export async function fetchAllPublishedLectures(): Promise<Lecture[]> {
  try {
    const q = query(collection(db, 'lectures'));
    const snapshot = await getDocs(q);
    const list: Lecture[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.published !== false) {
        list.push({
          id: docSnap.id,
          subjectId: data.subjectId || '',
          topicId: data.topicId || '',
          title: data.title || 'Video Lecture',
          description: data.description,
          storagePath: data.storagePath || data.videoUrl || '',
          videoUrl: data.videoUrl,
          thumbnail: data.thumbnail,
          duration: data.duration,
          order: data.order ?? 0,
          published: data.published ?? true,
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.error('Error fetching all published lectures:', err);
    return [];
  }
}

export function subscribeToLectureById(
  id: string,
  callback: (lecture: Lecture | null) => void
): () => void {
  try {
    const docRef = doc(db, 'lectures', id);
    const unsubscribe = onSnapshot(
      docRef,
      snap => {
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.published !== false) {
            callback({
              id: snap.id,
              subjectId: data.subjectId || '',
              topicId: data.topicId || '',
              title: data.title || 'Video Lecture',
              description: data.description,
              storagePath: data.storagePath || data.videoUrl || '',
              videoUrl: data.videoUrl,
              thumbnail: data.thumbnail,
              duration: data.duration,
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
        console.warn('Notice subscribing to lecture by id:', error);
        callback(null);
      }
    );
    return unsubscribe;
  } catch {
    callback(null);
    return () => {};
  }
}

export async function fetchLectureById(id: string): Promise<Lecture | null> {
  try {
    const snap = await getDoc(doc(db, 'lectures', id));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data.published !== false) {
        return {
          id: snap.id,
          subjectId: data.subjectId || '',
          topicId: data.topicId || '',
          title: data.title || 'Video Lecture',
          description: data.description,
          storagePath: data.storagePath || data.videoUrl || '',
          videoUrl: data.videoUrl,
          thumbnail: data.thumbnail,
          duration: data.duration,
          order: data.order ?? 0,
          published: data.published ?? true,
          ...data,
        };
      }
    }
  } catch (err) {
    console.error('Error fetching lecture by id:', err);
  }
  return null;
}
