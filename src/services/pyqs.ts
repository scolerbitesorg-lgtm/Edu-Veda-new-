import { collection, doc, getDoc, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { PYQ } from '../types';

export function subscribeToPublishedPYQs(
  callback: (pyqs: PYQ[]) => void
): () => void {
  try {
    const q = query(collection(db, 'pyqs'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: PYQ[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          if (data.published !== false && data.status !== 'draft') {
            list.push({
              id: docSnap.id,
              title: data.title || 'Previous Year Paper',
              exam: data.exam || data.category || 'General Exam',
              subject: data.subject || '',
              subjectId: data.subjectId,
              chapter: data.chapter,
              year: data.year ? Number(data.year) : undefined,
              description: data.description,
              pdfUrl: data.pdfUrl || data.fileUrl || data.url,
              fileUrl: data.fileUrl || data.pdfUrl,
              solutionPdfUrl: data.solutionPdfUrl,
              thumbnail: data.thumbnail,
              totalMarks: data.totalMarks,
              duration: data.duration,
              published: true,
              status: data.status || 'published',
              createdAt: data.createdAt,
              ...data,
            });
          }
        });
        // Sort by year descending, or creation date
        list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to PYQs:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchPublishedPYQs(): Promise<PYQ[]> {
  try {
    const snapshot = await getDocs(collection(db, 'pyqs'));
    const list: PYQ[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.published !== false && data.status !== 'draft') {
        list.push({
          id: docSnap.id,
          title: data.title || 'Previous Year Paper',
          ...data,
        });
      }
    });
    return list;
  } catch {
    return [];
  }
}
