import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { UserProgress, Topic, Lecture } from '../types';

export function subscribeToUserProgress(
  uid: string,
  callback: (progressList: UserProgress[]) => void
): () => void {
  // 1. Initial cached return for instant 0ms load
  try {
    const cached: UserProgress[] = JSON.parse(
      localStorage.getItem(`edu_progress_${uid}`) || '[]'
    );
    if (cached.length > 0) {
      callback(cached);
    }
  } catch {}

  try {
    const q = query(collection(db, 'progress'), where('uid', '==', uid));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        if (!snapshot.empty) {
          const list: UserProgress[] = [];
          snapshot.forEach(docSnap => {
            list.push(docSnap.data() as UserProgress);
          });
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          try {
            localStorage.setItem(`edu_progress_${uid}`, JSON.stringify(list));
          } catch {}
          callback(list);
        } else {
          // If Firestore is empty, check local cache or return empty
          try {
            const cached: UserProgress[] = JSON.parse(
              localStorage.getItem(`edu_progress_${uid}`) || '[]'
            );
            callback(cached);
          } catch {
            callback([]);
          }
        }
      },
      () => {
        try {
          const cached: UserProgress[] = JSON.parse(
            localStorage.getItem(`edu_progress_${uid}`) || '[]'
          );
          callback(cached);
        } catch {
          callback([]);
        }
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function saveUserProgress(
  uid: string,
  topicId: string,
  lectureId?: string,
  progress: number = 100,
  completed: boolean = true
): Promise<void> {
  const docId = `${uid}_${topicId}${lectureId ? '_' + lectureId : ''}`;
  const data: UserProgress = {
    id: docId,
    uid,
    topicId,
    lectureId,
    progress: Math.min(100, Math.max(0, Math.round(progress))),
    completed,
    updatedAt: new Date().toISOString(),
  };

  // Save to local cache immediately for 0ms response
  try {
    const existing: UserProgress[] = JSON.parse(
      localStorage.getItem(`edu_progress_${uid}`) || '[]'
    );
    const filtered = existing.filter(p => p.id !== docId);
    filtered.unshift(data);
    localStorage.setItem(`edu_progress_${uid}`, JSON.stringify(filtered));
  } catch {}

  // Sync to Firestore
  try {
    await setDoc(doc(db, 'progress', docId), data, { merge: true });
  } catch (err) {
    console.warn('Firestore progress sync fallback to local storage:', err);
  }
}

export async function fetchUserProgress(uid: string): Promise<UserProgress[]> {
  try {
    const q = query(collection(db, 'progress'), where('uid', '==', uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const list: UserProgress[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as UserProgress);
      });
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      try {
        localStorage.setItem(`edu_progress_${uid}`, JSON.stringify(list));
      } catch {}
      return list;
    }
  } catch {}

  try {
    const local: UserProgress[] = JSON.parse(
      localStorage.getItem(`edu_progress_${uid}`) || '[]'
    );
    return local;
  } catch {
    return [];
  }
}

export interface CalculatedStudyStats {
  overallPercentage: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  completedLecturesCount: number;
  totalLecturesCount: number;
}

export function computeStudyStats(
  progressList: UserProgress[],
  totalTopics: Topic[],
  totalLectures: Lecture[]
): CalculatedStudyStats {
  const totalTopicsCount = Math.max(1, totalTopics.length);
  const totalLecturesCount = Math.max(1, totalLectures.length);

  // Completed items
  const completedLectureIds = new Set(
    progressList.filter(p => p.lectureId && (p.completed || p.progress >= 80)).map(p => p.lectureId as string)
  );

  const completedTopicIds = new Set(
    progressList.filter(p => p.topicId && !p.lectureId && (p.completed || p.progress >= 100)).map(p => p.topicId)
  );

  // Also if all lectures of a topic are completed, count the topic as completed
  totalTopics.forEach(topic => {
    const topicLectures = totalLectures.filter(l => l.topicId === topic.id);
    if (topicLectures.length > 0) {
      const allWatched = topicLectures.every(l => completedLectureIds.has(l.id));
      if (allWatched) {
        completedTopicIds.add(topic.id);
      }
    }
  });

  const completedLecturesCount = completedLectureIds.size;
  const completedTopicsCount = completedTopicIds.size;

  // Weighted calculation: 60% topics/lessons progress, 40% videos watched
  const topicRatio = completedTopicsCount / totalTopicsCount;
  const lectureRatio = completedLecturesCount / totalLecturesCount;
  const overallPercentage = Math.min(100, Math.round((topicRatio * 0.5 + lectureRatio * 0.5) * 100));

  return {
    overallPercentage: Math.max(
      overallPercentage,
      // If user has any completed progress at all, show at least meaningful percent
      completedLecturesCount > 0 || completedTopicsCount > 0
        ? Math.max(5, Math.round(((completedLecturesCount + completedTopicsCount) / (totalLecturesCount + totalTopicsCount)) * 100))
        : 0
    ),
    completedTopicsCount,
    totalTopicsCount,
    completedLecturesCount,
    totalLecturesCount,
  };
}
