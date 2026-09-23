import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { MockAttempt, MCQAttempt } from '../types';

export function subscribeToUserMockAttempts(
  uid: string,
  callback: (attempts: MockAttempt[]) => void
): () => void {
  try {
    const q = query(collection(db, 'mockAttempts'), where('uid', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: MockAttempt[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<MockAttempt, 'id'>) });
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        try {
          localStorage.setItem(`edu_mock_attempts_${uid}`, JSON.stringify(list));
        } catch {}
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to mock attempts:', error);
        try {
          const local = JSON.parse(localStorage.getItem(`edu_mock_attempts_${uid}`) || '[]');
          callback(local);
        } catch {
          callback([]);
        }
      }
    );
    return unsubscribe;
  } catch {
    try {
      const local = JSON.parse(localStorage.getItem(`edu_mock_attempts_${uid}`) || '[]');
      callback(local);
    } catch {
      callback([]);
    }
    return () => {};
  }
}

export function subscribeToUserMCQAttempts(
  uid: string,
  callback: (attempts: MCQAttempt[]) => void
): () => void {
  try {
    const q = query(collection(db, 'mcqAttempts'), where('uid', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: MCQAttempt[] = [];
        snapshot.forEach(docSnap => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<MCQAttempt, 'id'>) });
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        try {
          localStorage.setItem(`edu_mcq_attempts_${uid}`, JSON.stringify(list));
        } catch {}
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to MCQ attempts:', error);
        try {
          const local = JSON.parse(localStorage.getItem(`edu_mcq_attempts_${uid}`) || '[]');
          callback(local);
        } catch {
          callback([]);
        }
      }
    );
    return unsubscribe;
  } catch {
    try {
      const local = JSON.parse(localStorage.getItem(`edu_mcq_attempts_${uid}`) || '[]');
      callback(local);
    } catch {
      callback([]);
    }
    return () => {};
  }
}

export async function saveMockAttempt(
  attempt: Omit<MockAttempt, 'id' | 'createdAt'>
): Promise<string> {
  const localId = `mock_att_${Date.now()}`;
  const newAttempt: MockAttempt = {
    ...attempt,
    id: localId,
    createdAt: new Date().toISOString(),
  };

  // Instant local caching
  try {
    const existing = JSON.parse(
      localStorage.getItem(`edu_mock_attempts_${attempt.uid}`) || '[]'
    );
    existing.unshift(newAttempt);
    localStorage.setItem(`edu_mock_attempts_${attempt.uid}`, JSON.stringify(existing));
  } catch {}

  // Sync to Firestore with timeout
  const collectionPath = 'mockAttempts';
  try {
    const docRef = (await Promise.race([
      addDoc(collection(db, collectionPath), {
        ...attempt,
        createdAt: new Date().toISOString(),
      }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ])) as any;
    if (docRef?.id) return docRef.id;
  } catch (err) {
    console.warn('Firestore mockAttempt write failed, cached locally:', err);
  }
  return localId;
}

export async function fetchUserMockAttempts(uid: string): Promise<MockAttempt[]> {
  const collectionPath = 'mockAttempts';
  try {
    const q = query(collection(db, collectionPath), where('uid', '==', uid));
    const snapshot = (await Promise.race([
      getDocs(q),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ])) as any;

    if (snapshot && !snapshot.empty) {
      const list: MockAttempt[] = [];
      snapshot.forEach((docSnap: any) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<MockAttempt, 'id'>) });
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    // fallback to local
  }

  try {
    const local = JSON.parse(localStorage.getItem(`edu_mock_attempts_${uid}`) || '[]');
    return local;
  } catch {
    return [];
  }
}

export async function saveMCQAttempt(
  attempt: Omit<MCQAttempt, 'id' | 'createdAt'>
): Promise<string> {
  const localId = `mcq_att_${Date.now()}`;
  const newAttempt: MCQAttempt = {
    ...attempt,
    id: localId,
    createdAt: new Date().toISOString(),
  };

  // Instant local caching
  try {
    const existing = JSON.parse(
      localStorage.getItem(`edu_mcq_attempts_${attempt.uid}`) || '[]'
    );
    existing.unshift(newAttempt);
    localStorage.setItem(`edu_mcq_attempts_${attempt.uid}`, JSON.stringify(existing));
  } catch {}

  // Sync to Firestore
  const collectionPath = 'mcqAttempts';
  try {
    const docRef = (await Promise.race([
      addDoc(collection(db, collectionPath), {
        ...attempt,
        createdAt: new Date().toISOString(),
      }),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ])) as any;
    if (docRef?.id) return docRef.id;
  } catch (err) {
    console.warn('Firestore mcqAttempt write failed, cached locally:', err);
  }
  return localId;
}

export async function fetchUserMCQAttempts(uid: string): Promise<MCQAttempt[]> {
  const collectionPath = 'mcqAttempts';
  try {
    const q = query(collection(db, collectionPath), where('uid', '==', uid));
    const snapshot = (await Promise.race([
      getDocs(q),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500)),
    ])) as any;

    if (snapshot && !snapshot.empty) {
      const list: MCQAttempt[] = [];
      snapshot.forEach((docSnap: any) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<MCQAttempt, 'id'>) });
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    // fallback
  }

  try {
    const local = JSON.parse(localStorage.getItem(`edu_mcq_attempts_${uid}`) || '[]');
    return local;
  } catch {
    return [];
  }
}
