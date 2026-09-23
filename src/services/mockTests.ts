import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { MockTest, MCQ } from '../types';

function normalizeMockTest(docSnap: any): MockTest {
  const data = docSnap.data() as any;
  const isPublished = data.status
    ? data.status === 'published' || data.status === 'active'
    : data.published !== false;

  return {
    id: docSnap.id,
    title: data.title || 'Mock Examination',
    subject: data.subject || data.subjectId || 'General Studies',
    subjectId: data.subjectId,
    description: data.description || 'Full length practice test with timer and negative marking.',
    duration: Number(data.duration || 30),
    totalMarks: Number(data.totalMarks || (data.totalQuestions ? data.totalQuestions * 2 : 50)),
    totalQuestions: data.totalQuestions || (Array.isArray(data.questionIds) ? data.questionIds.length : (Array.isArray(data.questions) ? data.questions.length : 25)),
    cutoffPercentage: Number(data.cutoffPercentage || 60),
    negativeMarking: Number(data.negativeMarking ?? 0.25),
    tags: Array.isArray(data.tags) ? data.tags : [],
    questionIds: Array.isArray(data.questionIds) ? data.questionIds : [],
    questions: Array.isArray(data.questions) ? data.questions : undefined,
    published: isPublished,
    status: data.status || (isPublished ? 'published' : 'draft'),
    featured: Boolean(data.featured),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    ...data,
  };
}

export function subscribeToPublishedMockTests(
  callback: (tests: MockTest[]) => void
): () => void {
  try {
    const q = query(collection(db, 'mockTests'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: MockTest[] = [];
        snapshot.forEach(docSnap => {
          const item = normalizeMockTest(docSnap);
          if (item.published) {
            list.push(item);
          }
        });
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to mock tests:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchPublishedMockTests(): Promise<MockTest[]> {
  try {
    const q = query(collection(db, 'mockTests'));
    const snapshot = await getDocs(q);
    const list: MockTest[] = [];
    snapshot.forEach(docSnap => {
      const item = normalizeMockTest(docSnap);
      if (item.published) {
        list.push(item);
      }
    });
    return list;
  } catch {
    return [];
  }
}

export async function fetchMockTestById(id: string): Promise<MockTest | null> {
  try {
    const docRef = doc(db, 'mockTests', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeMockTest(docSnap);
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchMockTestWithQuestions(id: string): Promise<MockTest | null> {
  const test = await fetchMockTestById(id);
  if (!test) return null;

  if (Array.isArray(test.questions) && test.questions.length > 0) {
    return test;
  }

  const questions: MCQ[] = [];
  if (Array.isArray(test.questionIds) && test.questionIds.length > 0) {
    for (const qId of test.questionIds) {
      try {
        const qSnap = await getDoc(doc(db, 'mcqs', qId));
        if (qSnap.exists()) {
          const qData = qSnap.data() as any;
          const options =
            Array.isArray(qData.options) && qData.options.length > 0
              ? qData.options
              : [
                  qData.optionA || '',
                  qData.optionB || '',
                  qData.optionC || '',
                  qData.optionD || '',
                ].filter(Boolean);
          questions.push({
            id: qSnap.id,
            subjectId: qData.subjectId || test.subjectId || '',
            topicId: qData.topicId || '',
            question: qData.question || '',
            options: options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: Number(qData.correctAnswer ?? 0),
            explanation: qData.explanation || '',
            published: true,
            ...qData,
          });
        }
      } catch {}
    }
  }

  if (questions.length === 0) {
    try {
      const qSnap = await getDocs(query(collection(db, 'mcqs')));
      qSnap.forEach(d => {
        const qData = d.data() as any;
        if (qData.published !== false && qData.status !== 'draft') {
          const options =
            Array.isArray(qData.options) && qData.options.length > 0
              ? qData.options
              : [
                  qData.optionA || '',
                  qData.optionB || '',
                  qData.optionC || '',
                  qData.optionD || '',
                ].filter(Boolean);
          questions.push({
            id: d.id,
            subjectId: qData.subjectId || '',
            topicId: qData.topicId || '',
            question: qData.question || '',
            options: options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: Number(qData.correctAnswer ?? 0),
            explanation: qData.explanation || '',
            published: true,
            ...qData,
          });
        }
      });
    } catch {}
  }

  return {
    ...test,
    questions,
  };
}
