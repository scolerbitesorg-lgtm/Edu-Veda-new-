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

/**
 * Saves lecture or topic progress.
 * Formula: Each topic is 60% completed by watching the Video and 40% completed by solving the MCQs.
 */
export async function saveUserProgress(
  uid: string,
  topicId: string,
  lectureId?: string,
  progress: number = 100,
  completed: boolean = true
): Promise<void> {
  if (!uid || !topicId) return;

  const now = new Date().toISOString();
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const isComplete = completed || clampedProgress >= 80;

  // Retrieve cached progress list
  let existingList: UserProgress[] = [];
  try {
    existingList = JSON.parse(localStorage.getItem(`edu_progress_${uid}`) || '[]');
  } catch {}

  // 1. If saving a specific lecture
  if (lectureId) {
    const lectureDocId = `${uid}_${topicId}_${lectureId}`;
    const lectureData: UserProgress = {
      id: lectureDocId,
      uid,
      topicId,
      lectureId,
      progress: clampedProgress,
      completed: isComplete,
      updatedAt: now,
    };

    // Update local cache for lecture
    existingList = existingList.filter(p => p.id !== lectureDocId);
    existingList.unshift(lectureData);

    // Also automatically update parent Topic progress (60% Video + 40% MCQ)
    if (isComplete) {
      const topicDocId = `${uid}_${topicId}`;
      const existingTopicProgress = existingList.find(
        p => p.topicId === topicId && (!p.lectureId || p.id === topicDocId)
      );

      const mcqDone = Boolean(existingTopicProgress?.mcqCompleted);
      const videoDone = true;

      // 60% Video + 40% MCQ
      const calculatedTopicPercent = (videoDone ? 60 : 0) + (mcqDone ? 40 : 0);
      const topicCompleted = calculatedTopicPercent >= 100;

      const topicData: UserProgress = {
        id: topicDocId,
        uid,
        topicId,
        progress: calculatedTopicPercent,
        completed: topicCompleted,
        videoCompleted: true,
        mcqCompleted: mcqDone,
        updatedAt: now,
      };

      existingList = existingList.filter(p => p.id !== topicDocId);
      existingList.unshift(topicData);

      // Save topic to Firestore
      try {
        await setDoc(doc(db, 'progress', topicDocId), topicData, { merge: true });
      } catch (err) {
        console.warn('Topic progress sync fallback:', err);
      }
    }

    // Save lecture to local storage and Firestore
    try {
      localStorage.setItem(`edu_progress_${uid}`, JSON.stringify(existingList));
      await setDoc(doc(db, 'progress', lectureDocId), lectureData, { merge: true });
    } catch (err) {
      console.warn('Lecture progress sync fallback:', err);
    }
  } else {
    // 2. Direct topic progress save
    const topicDocId = `${uid}_${topicId}`;
    const existingTopic = existingList.find(p => p.id === topicDocId);

    const topicData: UserProgress = {
      id: topicDocId,
      uid,
      topicId,
      progress: clampedProgress,
      completed: isComplete,
      videoCompleted: existingTopic?.videoCompleted || clampedProgress >= 60,
      mcqCompleted: existingTopic?.mcqCompleted || isComplete,
      updatedAt: now,
    };

    existingList = existingList.filter(p => p.id !== topicDocId);
    existingList.unshift(topicData);

    try {
      localStorage.setItem(`edu_progress_${uid}`, JSON.stringify(existingList));
      await setDoc(doc(db, 'progress', topicDocId), topicData, { merge: true });
    } catch (err) {
      console.warn('Direct topic progress sync fallback:', err);
    }
  }
}

/**
 * Specifically marks MCQ completion for a topic.
 * Gives 40% progress for MCQ. If Video was already watched (60%), topic reaches 100%.
 */
export async function saveTopicMCQCompletion(
  uid: string,
  topicId: string
): Promise<void> {
  if (!uid || !topicId) return;

  const now = new Date().toISOString();
  let existingList: UserProgress[] = [];
  try {
    existingList = JSON.parse(localStorage.getItem(`edu_progress_${uid}`) || '[]');
  } catch {}

  const topicDocId = `${uid}_${topicId}`;
  const existingTopic = existingList.find(p => p.id === topicDocId);

  // Check if video was watched
  const videoDone =
    Boolean(existingTopic?.videoCompleted) ||
    existingList.some(p => p.topicId === topicId && p.lectureId && (p.completed || p.progress >= 80));

  const mcqDone = true;

  // Formula: 60% Video + 40% MCQ
  const calculatedTopicPercent = (videoDone ? 60 : 0) + (mcqDone ? 40 : 0);
  const topicCompleted = calculatedTopicPercent >= 100;

  const topicData: UserProgress = {
    id: topicDocId,
    uid,
    topicId,
    progress: calculatedTopicPercent,
    completed: topicCompleted,
    videoCompleted: videoDone,
    mcqCompleted: true,
    updatedAt: now,
  };

  existingList = existingList.filter(p => p.id !== topicDocId);
  existingList.unshift(topicData);

  try {
    localStorage.setItem(`edu_progress_${uid}`, JSON.stringify(existingList));
    await setDoc(doc(db, 'progress', topicDocId), topicData, { merge: true });
  } catch (err) {
    console.warn('MCQ topic progress sync fallback:', err);
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

/**
 * Computes study statistics across all topics and lectures using the 60% Video + 40% MCQ rule.
 */
export function computeStudyStats(
  progressList: UserProgress[],
  totalTopics: Topic[],
  totalLectures: Lecture[]
): CalculatedStudyStats {
  const totalTopicsCount = Math.max(1, totalTopics.length);
  const totalLecturesCount = Math.max(1, totalLectures.length);

  // Completed lecture IDs
  const completedLectureIds = new Set(
    progressList
      .filter(p => p.lectureId && (p.completed || p.progress >= 80))
      .map(p => p.lectureId as string)
  );

  let completedTopicsCount = 0;
  let accumulatedProgress = 0;

  totalTopics.forEach(topic => {
    const topicProgressDoc = progressList.find(
      p => p.topicId === topic.id && !p.lectureId
    );

    const hasWatchedLecture =
      topicProgressDoc?.videoCompleted ||
      totalLectures.some(
        l => l.topicId === topic.id && completedLectureIds.has(l.id)
      );

    const hasDoneMCQ = topicProgressDoc?.mcqCompleted || topicProgressDoc?.completed;

    let topicPercent = 0;
    if (topicProgressDoc?.progress !== undefined && topicProgressDoc.progress > 0) {
      topicPercent = topicProgressDoc.progress;
    } else {
      topicPercent = (hasWatchedLecture ? 60 : 0) + (hasDoneMCQ ? 40 : 0);
    }

    if (topicPercent >= 100 || (hasWatchedLecture && hasDoneMCQ)) {
      completedTopicsCount++;
      topicPercent = 100;
    }

    accumulatedProgress += topicPercent;
  });

  const completedLecturesCount = completedLectureIds.size;
  const overallPercentage = Math.min(
    100,
    Math.round(accumulatedProgress / totalTopicsCount)
  );

  return {
    overallPercentage: Math.max(
      overallPercentage,
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
