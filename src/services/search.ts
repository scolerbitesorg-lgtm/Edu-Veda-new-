import { fetchPublishedSubjects } from './subjects';
import { fetchAllPublishedTopics } from './topics';
import { fetchAllPublishedLectures } from './lectures';
import { fetchAllPublishedNotes } from './notes';
import type { SearchResultItem } from '../types';

export interface GroupedSearchResults {
  subjects: SearchResultItem[];
  topics: SearchResultItem[];
  lectures: SearchResultItem[];
  notes: SearchResultItem[];
  totalCount: number;
}

export async function searchEducationalContent(searchTerm: string): Promise<GroupedSearchResults> {
  const query = searchTerm.trim().toLowerCase();
  if (!query) {
    return { subjects: [], topics: [], lectures: [], notes: [], totalCount: 0 };
  }

  const [subjects, topics, lectures, notes] = await Promise.all([
    fetchPublishedSubjects().catch(() => []),
    fetchAllPublishedTopics().catch(() => []),
    fetchAllPublishedLectures().catch(() => []),
    fetchAllPublishedNotes().catch(() => []),
  ]);

  const matchedSubjects: SearchResultItem[] = subjects
    .filter(
      s =>
        s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
    )
    .map(s => ({
      id: s.id,
      title: s.name,
      type: 'subject',
      subtitle: s.description || 'Subject Course',
      subjectId: s.id,
    }));

  const matchedTopics: SearchResultItem[] = topics
    .filter(
      t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
    )
    .map(t => ({
      id: t.id,
      title: t.title,
      type: 'topic',
      subtitle: t.description || 'Topic Unit',
      subjectId: t.subjectId,
      topicId: t.id,
    }));

  const matchedLectures: SearchResultItem[] = lectures
    .filter(
      l =>
        l.title.toLowerCase().includes(query) ||
        (l.description && l.description.toLowerCase().includes(query))
    )
    .map(l => ({
      id: l.id,
      title: l.title,
      type: 'lecture',
      subtitle: l.description ? l.description.slice(0, 80) + '...' : 'Video Lecture',
      subjectId: l.subjectId,
      topicId: l.topicId,
    }));

  const matchedNotes: SearchResultItem[] = notes
    .filter(
      n =>
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query))
    )
    .map(n => ({
      id: n.id,
      title: n.title,
      type: 'note',
      subtitle: `${n.type.toUpperCase()} Study Note`,
      subjectId: n.subjectId,
      topicId: n.topicId,
    }));

  const totalCount =
    matchedSubjects.length + matchedTopics.length + matchedLectures.length + matchedNotes.length;

  return {
    subjects: matchedSubjects,
    topics: matchedTopics,
    lectures: matchedLectures,
    notes: matchedNotes,
    totalCount,
  };
}
