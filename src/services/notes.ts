import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Note } from '../types';

function normalizeNote(docSnap: any): Note {
  const data = docSnap.data() as any;
  const isPublished = data.status
    ? data.status === 'published' || data.status === 'active'
    : data.published !== false;

  const resolvedPdfUrl = data.pdfUrl || data.fileUrl || data.storagePath;

  return {
    id: docSnap.id,
    subjectId: data.subjectId || data.subject || '',
    topicId: data.topicId || data.chapter || '',
    subject: data.subject || data.subjectName || '',
    chapter: data.chapter || data.topicTitle || '',
    title: data.title || 'Revision Note',
    type: data.type || (resolvedPdfUrl ? 'pdf' : 'text'),
    content: data.content || data.description || '',
    storagePath: resolvedPdfUrl,
    pdfUrl: resolvedPdfUrl,
    fileUrl: resolvedPdfUrl,
    thumbnail: data.thumbnail,
    order: data.order ?? 0,
    published: isPublished,
    status: data.status || 'published',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    ...data,
  };
}

export function subscribeToAllPublishedNotes(
  callback: (notes: Note[]) => void
): () => void {
  try {
    const q = query(collection(db, 'notes'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Note[] = [];
        snapshot.forEach(docSnap => {
          const item = normalizeNote(docSnap);
          if (item.published) {
            list.push(item);
          }
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to all notes:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeToNotesByTopic(
  topicId: string,
  callback: (notes: Note[]) => void
): () => void {
  try {
    const q = query(collection(db, 'notes'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Note[] = [];
        snapshot.forEach(docSnap => {
          const item = normalizeNote(docSnap);
          if ((item.topicId === topicId || item.chapter === topicId) && item.published) {
            list.push(item);
          }
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to notes by topic:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export const subscribeToAllNotes = subscribeToAllPublishedNotes;

export async function fetchAllPublishedNotes(): Promise<Note[]> {
  try {
    const q = query(collection(db, 'notes'));
    const snapshot = await getDocs(q);
    const list: Note[] = [];
    snapshot.forEach(docSnap => {
      const item = normalizeNote(docSnap);
      if (item.published) {
        list.push(item);
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

export function subscribeToNoteById(
  id: string,
  callback: (note: Note | null) => void
): () => void {
  try {
    const docRef = doc(db, 'notes', id);
    const unsubscribe = onSnapshot(
      docRef,
      docSnap => {
        if (docSnap.exists()) {
          callback(normalizeNote(docSnap));
        } else {
          callback(null);
        }
      },
      error => {
        console.warn('Notice subscribing to note by id:', error);
        callback(null);
      }
    );
    return unsubscribe;
  } catch {
    callback(null);
    return () => {};
  }
}

export async function fetchNoteById(id: string): Promise<Note | null> {
  try {
    const docRef = doc(db, 'notes', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeNote(docSnap);
    }
    return null;
  } catch {
    return null;
  }
}
