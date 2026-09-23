import { collection, doc, getDoc, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { HomeSection } from '../types';

export const defaultHomeSections: HomeSection[] = [
  {
    id: 'sec-announcements',
    sectionId: 'announcements',
    title: 'Important Alerts',
    subtitle: 'Exam updates & notifications',
    order: 1,
    visible: true,
  },
  {
    id: 'sec-banners',
    sectionId: 'banners',
    title: 'Featured Programs',
    subtitle: 'Latest courses & resources',
    order: 2,
    visible: true,
  },
  {
    id: 'sec-categories',
    sectionId: 'categories',
    title: 'Explore Categories',
    subtitle: 'Choose your examination stream',
    order: 3,
    visible: true,
  },
  {
    id: 'sec-subjects',
    sectionId: 'featuredSubjects',
    title: 'Academic Subjects',
    subtitle: 'Comprehensive syllabus & lectures',
    order: 4,
    visible: true,
  },
  {
    id: 'sec-tests',
    sectionId: 'featuredTests',
    title: 'Live Mock Tests',
    subtitle: 'Timed test series with negative marking',
    order: 5,
    visible: true,
  },
  {
    id: 'sec-pyqs',
    sectionId: 'pyqs',
    title: 'Previous Year Papers',
    subtitle: 'Exam PYQs with answer keys & solutions',
    order: 6,
    visible: true,
  },
  {
    id: 'sec-notes',
    sectionId: 'quickNotes',
    title: 'Revision Notes & Handouts',
    subtitle: 'Quick chapter summaries & PDFs',
    order: 7,
    visible: true,
  },
];

export function subscribeToHomeSections(
  callback: (sections: HomeSection[]) => void
): () => void {
  try {
    const q = query(collection(db, 'homeSections'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        if (snapshot.empty) {
          callback(defaultHomeSections);
          return;
        }

        const list: HomeSection[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            sectionId: data.sectionId || docSnap.id,
            title: data.title || 'Section',
            subtitle: data.subtitle,
            order: data.order ?? 99,
            visible: data.visible !== false,
            itemLimit: data.itemLimit,
            ...data,
          });
        });

        list.sort((a, b) => a.order - b.order);
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to home sections:', error);
        callback(defaultHomeSections);
      }
    );
    return unsubscribe;
  } catch {
    callback(defaultHomeSections);
    return () => {};
  }
}
