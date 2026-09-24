import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Banner, AppSettings } from '../types';

/**
 * Normalizes any raw banner document from Admin Panel
 */
export function normalizeBannerData(id: string, data: Record<string, any>): Banner {
  const image =
    data.image ||
    data.imageUrl ||
    data.bannerImage ||
    data.photo ||
    data.poster ||
    data.thumbnail ||
    data.img ||
    '';

  const title = data.title || data.heading || data.name || data.bannerTitle || '';
  const subtitle = data.subtitle || data.subTitle || data.description || data.desc || data.bannerSubtitle || '';
  const buttonText = data.buttonText || data.btnText || data.ctaText || data.bannerButtonText || 'Explore Now';
  const buttonUrl = data.buttonUrl || data.link || data.url || data.targetUrl || data.bannerUrl || '';
  const actionType = data.actionType || data.type || (buttonUrl.startsWith('http') ? 'link' : undefined);

  return {
    id,
    title,
    subtitle,
    image,
    buttonText,
    buttonUrl,
    buttonVisible: data.buttonVisible !== false,
    actionType: (actionType as any) || 'link',
    actionTargetId: data.actionTargetId || data.targetId,
    order: data.order ?? 0,
    published: data.published !== false && data.status !== 'draft',
    ...data,
  };
}

/**
 * Real-time subscription to banners across all potential collections and admin configurations:
 * 1. 'banners' collection
 * 2. 'heroBanners' collection
 * 3. 'promotions' collection
 * 4. Merges settings-based banners (e.g. appSettings.banners array, bannerTitle, bannerImage)
 */
export function subscribeToBanners(
  callback: (banners: Banner[]) => void,
  fallbackSettings?: AppSettings | null
): () => void {
  const sources: Map<string, Banner[]> = new Map();
  const unsubscribers: (() => void)[] = [];

  const updateMergedBanners = () => {
    const allBanners: Banner[] = [];
    const seenIds = new Set<string>();

    // 1. Collect from firestore collections
    for (const [, list] of sources) {
      for (const b of list) {
        if (!seenIds.has(b.id) && b.published !== false && (b.title || b.image)) {
          seenIds.add(b.id);
          allBanners.push(b);
        }
      }
    }

    // 2. Check if admin configured banners in settings object
    if (fallbackSettings) {
      if (Array.isArray(fallbackSettings.banners) && fallbackSettings.banners.length > 0) {
        fallbackSettings.banners.forEach((raw, idx) => {
          const norm = normalizeBannerData(raw.id || `settings-banner-${idx}`, raw);
          if (!seenIds.has(norm.id) && norm.published !== false && (norm.title || norm.image)) {
            seenIds.add(norm.id);
            allBanners.push(norm);
          }
        });
      }

      // Check single banner fields from settings
      if (fallbackSettings.bannerTitle || fallbackSettings.bannerImage) {
        const singleBannerId = 'settings-primary-banner';
        if (!seenIds.has(singleBannerId)) {
          allBanners.push({
            id: singleBannerId,
            title: fallbackSettings.bannerTitle || 'Edu Veda Learning Hub',
            subtitle: fallbackSettings.bannerSubtitle || fallbackSettings.subTitle || 'Comprehensive exam preparation, syllabus & video lectures',
            image: fallbackSettings.bannerImage || '',
            buttonText: fallbackSettings.bannerButtonText || 'Start Learning',
            buttonUrl: fallbackSettings.bannerUrl || '',
            buttonVisible: fallbackSettings.bannerButtonVisible !== false,
            actionType: 'link',
            order: -1,
            published: true,
          });
        }
      }
    }

    allBanners.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // If completely empty, supply default engaging curriculum banner
    if (allBanners.length === 0) {
      allBanners.push({
        id: 'default-curriculum-banner',
        title: 'Master Your Competitive Exams',
        subtitle: 'Comprehensive syllabus lessons, video lectures, and practice MCQs with Veda AI mentor',
        image: '',
        buttonText: 'Start Learning',
        buttonVisible: true,
        actionType: 'link',
        order: 0,
        published: true,
      });
    }

    callback(allBanners);
  };

  // Helper to attach collection listener
  const attachListener = (collectionName: string) => {
    try {
      const unsub = onSnapshot(
        collection(db, collectionName),
        snapshot => {
          const list: Banner[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            list.push(normalizeBannerData(docSnap.id, data));
          });
          sources.set(collectionName, list);
          updateMergedBanners();
        },
        () => {
          sources.set(collectionName, []);
          updateMergedBanners();
        }
      );
      unsubscribers.push(unsub);
    } catch {
      sources.set(collectionName, []);
    }
  };

  attachListener('banners');
  attachListener('heroBanners');
  attachListener('promotions');

  // Trigger initial calculation
  updateMergedBanners();

  return () => {
    unsubscribers.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
  };
}
