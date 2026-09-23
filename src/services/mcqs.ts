import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { MCQ } from '../types';

function parseOptions(data: any): string[] {
  if (Array.isArray(data.options) && data.options.length > 0) {
    return data.options.map((opt: any) => String(opt || '').trim());
  }
  const opts: string[] = [];
  if (data.optionA !== undefined) opts.push(String(data.optionA));
  if (data.optionB !== undefined) opts.push(String(data.optionB));
  if (data.optionC !== undefined) opts.push(String(data.optionC));
  if (data.optionD !== undefined) opts.push(String(data.optionD));
  return opts;
}

function parseCorrectAnswer(ans: any): number {
  if (typeof ans === 'number' && ans >= 0 && ans <= 3) return ans;
  if (typeof ans === 'string') {
    const upper = ans.trim().toUpperCase();
    if (upper === 'A' || upper === '0') return 0;
    if (upper === 'B' || upper === '1') return 1;
    if (upper === 'C' || upper === '2') return 2;
    if (upper === 'D' || upper === '3') return 3;
    const parsed = parseInt(ans, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) return parsed;
  }
  return 0;
}

function normalizeMCQ(docSnap: any): MCQ {
  const data = docSnap.data() as any;
  const options = parseOptions(data);
  const correctAnswer = parseCorrectAnswer(data.correctAnswer);
  const isPublished = data.status
    ? data.status === 'published' || data.status === 'active'
    : data.published !== false;

  return {
    id: docSnap.id,
    subjectId: data.subjectId || data.subject || '',
    topicId: data.topicId || data.chapter || '',
    subject: data.subject || data.subjectId || '',
    chapter: data.chapter || data.topicTitle || '',
    question: data.question || '',
    hindiQuestion: data.hindiQuestion,
    optionA: data.optionA ?? options[0] ?? '',
    optionB: data.optionB ?? options[1] ?? '',
    optionC: data.optionC ?? options[2] ?? '',
    optionD: data.optionD ?? options[3] ?? '',
    options: options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer,
    explanation: data.explanation || '',
    difficulty: (data.difficulty as any) || 'medium',
    status: data.status || 'published',
    published: isPublished,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    ...data,
  };
}

export function subscribeToAllPublishedMCQs(
  callback: (mcqs: MCQ[]) => void
): () => void {
  try {
    const q = query(collection(db, 'mcqs'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: MCQ[] = [];
        snapshot.forEach(docSnap => {
          const item = normalizeMCQ(docSnap);
          if (item.published) {
            list.push(item);
          }
        });
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to MCQs:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeToMCQsByTopic(
  topicId: string,
  callback: (mcqs: MCQ[]) => void
): () => void {
  try {
    const q = query(collection(db, 'mcqs'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: MCQ[] = [];
        snapshot.forEach(docSnap => {
          const item = normalizeMCQ(docSnap);
          if ((item.topicId === topicId || item.chapter === topicId) && item.published) {
            list.push(item);
          }
        });
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to MCQs by topic:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchMCQsByTopic(topicId: string): Promise<MCQ[]> {
  try {
    const q = query(collection(db, 'mcqs'));
    const snapshot = await getDocs(q);
    const list: MCQ[] = [];
    snapshot.forEach(docSnap => {
      const item = normalizeMCQ(docSnap);
      if ((item.topicId === topicId || item.chapter === topicId) && item.published) {
        list.push(item);
      }
    });
    return list;
  } catch (err) {
    console.warn('Notice fetching MCQs by topic:', err);
    return [];
  }
}

export async function fetchMCQById(id: string): Promise<MCQ | null> {
  try {
    const docRef = doc(db, 'mcqs', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeMCQ(docSnap);
    }
    return null;
  } catch {
    return null;
  }
}
