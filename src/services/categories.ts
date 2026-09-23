import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Category } from '../types';

export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
  try {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: Category[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as any;
          const isPublished = data.published !== false && data.status !== 'draft';
          if (isPublished) {
            list.push({
              id: docSnap.id,
              name: data.name || 'Category',
              hindiName: data.hindiName,
              description: data.description,
              icon: data.icon || 'folder',
              color: data.color || '#4f46e5',
              order: data.order ?? 0,
              published: true,
              ...data,
            });
          }
        });
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        callback(list);
      },
      error => {
        console.warn('Notice subscribing to categories:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch {
    callback([]);
    return () => {};
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));
    const list: Category[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as any;
      if (data.published !== false && data.status !== 'draft') {
        list.push({
          id: docSnap.id,
          name: data.name || 'Category',
          ...data,
        });
      }
    });
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (err) {
    console.warn('Notice fetching categories:', err);
    return [];
  }
}
