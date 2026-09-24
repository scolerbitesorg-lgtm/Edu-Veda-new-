import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { QuickLink, CustomSection, Announcement, AppSettings } from '../types';

/**
 * Normalizes quick link data added by Admin
 */
export function normalizeQuickLink(id: string, data: Record<string, any>): QuickLink {
  const title = data.title || data.name || data.label || 'Shortcut';
  const subtitle = data.subtitle || data.subTitle || data.desc || '';
  const icon = data.icon || data.iconName || data.image || '';
  const url = data.url || data.link || data.buttonUrl || '';
  const actionType = data.actionType || data.type || (url.startsWith('http') ? 'link' : undefined);

  return {
    id,
    title,
    subtitle,
    icon,
    image: data.image,
    badge: data.badge || data.tag,
    color: data.color || '#4f46e5',
    bgColor: data.bgColor || '#eef2ff',
    url,
    link: url,
    actionType,
    targetId: data.targetId || data.actionTargetId,
    order: data.order ?? 99,
    published: data.published !== false && data.status !== 'draft',
    ...data,
  };
}

/**
 * Real-time subscription to Quick Links / Feature Shortcuts added by Admin
 */
export function subscribeToQuickLinks(
  callback: (links: QuickLink[]) => void,
  fallbackSettings?: AppSettings | null
): () => void {
  const sources: Map<string, QuickLink[]> = new Map();
  const unsubscribers: (() => void)[] = [];

  const updateMerged = () => {
    const list: QuickLink[] = [];
    const seenIds = new Set<string>();

    for (const [, items] of sources) {
      for (const item of items) {
        if (!seenIds.has(item.id) && item.published !== false) {
          seenIds.add(item.id);
          list.push(item);
        }
      }
    }

    // Merge settings.quickLinks if present
    if (fallbackSettings && Array.isArray((fallbackSettings as any).quickLinks)) {
      (fallbackSettings as any).quickLinks.forEach((raw: any, idx: number) => {
        const norm = normalizeQuickLink(raw.id || `settings-quicklink-${idx}`, raw);
        if (!seenIds.has(norm.id) && norm.published !== false) {
          seenIds.add(norm.id);
          list.push(norm);
        }
      });
    }

    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

    // If admin hasn't created any custom quicklinks, provide smart defaults
    if (list.length === 0) {
      callback([
        {
          id: 'def-mock-test',
          title: 'Live Tests',
          subtitle: 'All-India Rank',
          icon: 'Award',
          color: '#4f46e5',
          bgColor: '#eef2ff',
          badge: 'Live',
          actionType: 'test',
          order: 1,
          published: true,
        },
        {
          id: 'def-notes',
          title: 'Study Notes',
          subtitle: 'PDFs & Summaries',
          icon: 'FileText',
          color: '#0284c7',
          bgColor: '#f0f9ff',
          actionType: 'notes',
          order: 2,
          published: true,
        },
        {
          id: 'def-pyqs',
          title: 'Exam PYQs',
          subtitle: 'Previous Years',
          icon: 'CheckSquare',
          color: '#059669',
          bgColor: '#ecfdf5',
          actionType: 'pyqs',
          order: 3,
          published: true,
        },
        {
          id: 'def-ai-tutor',
          title: 'Veda AI',
          subtitle: 'Ask Any Doubt',
          icon: 'Sparkles',
          color: '#7c3aed',
          bgColor: '#f5f3ff',
          badge: '24/7',
          actionType: 'ai',
          order: 4,
          published: true,
        },
      ]);
      return;
    }

    callback(list);
  };

  const attach = (colName: string) => {
    try {
      const unsub = onSnapshot(
        collection(db, colName),
        snap => {
          const items: QuickLink[] = [];
          snap.forEach(d => {
            items.push(normalizeQuickLink(d.id, d.data()));
          });
          sources.set(colName, items);
          updateMerged();
        },
        () => {
          sources.set(colName, []);
          updateMerged();
        }
      );
      unsubscribers.push(unsub);
    } catch {
      sources.set(colName, []);
    }
  };

  attach('quickLinks');
  attach('features');

  updateMerged();

  return () => {
    unsubscribers.forEach(u => {
      try {
        u();
      } catch {}
    });
  };
}

/**
 * Normalizes custom sections added by Admin
 */
export function normalizeCustomSection(id: string, data: Record<string, any>): CustomSection {
  const items = Array.isArray(data.items)
    ? data.items.map((it: any, idx: number) => ({
        id: it.id || `${id}-item-${idx}`,
        title: it.title || it.heading || it.name || 'Item',
        subtitle: it.subtitle || it.description || '',
        description: it.description || '',
        image: it.image || it.imageUrl || it.thumbnail || '',
        icon: it.icon || '',
        badge: it.badge || it.tag || '',
        buttonText: it.buttonText || it.ctaText || 'Open',
        url: it.url || it.link || '',
        link: it.link || it.url || '',
        actionType: it.actionType || it.type,
        targetId: it.targetId,
        ...it,
      }))
    : [];

  return {
    id,
    sectionId: data.sectionId || id,
    title: data.title || data.heading || 'Section',
    subtitle: data.subtitle || data.description || '',
    badge: data.badge || data.tag,
    type: data.type || data.layout || (items.length > 0 ? 'cards' : 'notice'),
    order: data.order ?? 99,
    visible: data.visible !== false,
    items,
    htmlContent: data.htmlContent || data.html,
    buttonText: data.buttonText,
    buttonUrl: data.buttonUrl || data.link,
    ...data,
  };
}

/**
 * Real-time subscription to Custom Sections and Dynamic Blocks added by Admin
 */
export function subscribeToCustomSections(
  callback: (sections: CustomSection[]) => void
): () => void {
  const sources: Map<string, CustomSection[]> = new Map();
  const unsubscribers: (() => void)[] = [];

  const update = () => {
    const list: CustomSection[] = [];
    const seenIds = new Set<string>();

    for (const [, items] of sources) {
      for (const s of items) {
        if (!seenIds.has(s.id) && s.visible !== false && (s.title || (s.items && s.items.length > 0))) {
          seenIds.add(s.id);
          list.push(s);
        }
      }
    }

    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    callback(list);
  };

  const attach = (colName: string) => {
    try {
      const unsub = onSnapshot(
        collection(db, colName),
        snap => {
          const items: CustomSection[] = [];
          snap.forEach(d => {
            const data = d.data();
            // Exclude system default section IDs if handled natively
            if (
              d.id !== 'sec-subjects' &&
              d.id !== 'sec-banners' &&
              d.id !== 'sec-announcements'
            ) {
              items.push(normalizeCustomSection(d.id, data));
            }
          });
          sources.set(colName, items);
          update();
        },
        () => {
          sources.set(colName, []);
          update();
        }
      );
      unsubscribers.push(unsub);
    } catch {
      sources.set(colName, []);
    }
  };

  attach('customSections');
  attach('widgets');

  update();

  return () => {
    unsubscribers.forEach(u => {
      try {
        u();
      } catch {}
    });
  };
}

/**
 * Real-time subscription to Announcements and Alerts added by Admin
 */
export function subscribeToDynamicAnnouncements(
  callback: (announcements: Announcement[]) => void,
  fallbackSettings?: AppSettings | null
): () => void {
  const sources: Map<string, Announcement[]> = new Map();
  const unsubscribers: (() => void)[] = [];

  const update = () => {
    const list: Announcement[] = [];
    const seen = new Set<string>();

    for (const [, items] of sources) {
      for (const a of items) {
        if (!seen.has(a.id) && a.published !== false && (a.title || a.message)) {
          seen.add(a.id);
          list.push(a);
        }
      }
    }

    // Check if announcement is configured in settings
    if (fallbackSettings) {
      if (fallbackSettings.announcement && fallbackSettings.announcement.trim()) {
        const id = 'settings-announcement';
        if (!seen.has(id)) {
          list.push({
            id,
            title: 'Notice',
            message: fallbackSettings.announcement.trim(),
            badge: 'Update',
            published: true,
          });
        }
      } else if (fallbackSettings.showBanner && fallbackSettings.bannerNotice) {
        const id = 'settings-banner-notice';
        if (!seen.has(id)) {
          list.push({
            id,
            title: 'Alert',
            message: fallbackSettings.bannerNotice.trim(),
            badge: 'Important',
            published: true,
          });
        }
      }
    }

    callback(list);
  };

  const attach = (colName: string) => {
    try {
      const unsub = onSnapshot(
        collection(db, colName),
        snap => {
          const items: Announcement[] = [];
          snap.forEach(d => {
            const data = d.data();
            if (data.published !== false && data.status !== 'draft') {
              items.push({
                id: d.id,
                title: data.title || data.heading || 'Notice',
                message: data.message || data.text || data.content || '',
                badge: data.badge || data.tag || 'New',
                link: data.link || data.url,
                published: true,
                createdAt: data.createdAt,
                ...data,
              });
            }
          });
          sources.set(colName, items);
          update();
        },
        () => {
          sources.set(colName, []);
          update();
        }
      );
      unsubscribers.push(unsub);
    } catch {
      sources.set(colName, []);
    }
  };

  attach('announcements');
  attach('notices');

  update();

  return () => {
    unsubscribers.forEach(u => {
      try {
        u();
      } catch {}
    });
  };
}
