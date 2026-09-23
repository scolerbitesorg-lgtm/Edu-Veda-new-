import type { MCQ, Note } from '../types';

export function getBookmarkedQuestions(uid: string): MCQ[] {
  try {
    const raw = localStorage.getItem(`edu_bookmarked_questions_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkQuestion(uid: string, question: MCQ): boolean {
  try {
    const list = getBookmarkedQuestions(uid);
    const index = list.findIndex(q => q.id === question.id);
    let isBookmarked = false;
    if (index >= 0) {
      list.splice(index, 1);
      isBookmarked = false;
    } else {
      list.unshift(question);
      isBookmarked = true;
    }
    localStorage.setItem(`edu_bookmarked_questions_${uid}`, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bookmarks_updated'));
    return isBookmarked;
  } catch {
    return false;
  }
}

export function isQuestionBookmarked(uid: string, questionId: string): boolean {
  try {
    const list = getBookmarkedQuestions(uid);
    return list.some(q => q.id === questionId);
  } catch {
    return false;
  }
}

export function getSavedNotes(uid: string): Note[] {
  try {
    const raw = localStorage.getItem(`edu_saved_notes_${uid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveNote(uid: string, note: Note): boolean {
  try {
    const list = getSavedNotes(uid);
    const index = list.findIndex(n => n.id === note.id);
    let isSaved = false;
    if (index >= 0) {
      list.splice(index, 1);
      isSaved = false;
    } else {
      list.unshift(note);
      isSaved = true;
    }
    localStorage.setItem(`edu_saved_notes_${uid}`, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bookmarks_updated'));
    return isSaved;
  } catch {
    return false;
  }
}

export function isNoteSaved(uid: string, noteId: string): boolean {
  try {
    const list = getSavedNotes(uid);
    return list.some(n => n.id === noteId);
  } catch {
    return false;
  }
}
