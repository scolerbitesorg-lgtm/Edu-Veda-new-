import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Banner, AppSettings } from '../types';

/**
 * Normalizes any raw banner document from Admin Panel
 */
export function normalizeBannerData(id: string, data: Record<string, any>): Banner {
  const image =
    data.image ||
    data.imageUrl ||
    data.image_url ||
    data.bannerImage ||
    data.banner_image ||
    data.img ||
    data.imgUrl ||
    data.photo ||
    data.poster ||
    data.thumbnail ||
    data.thumb ||
    data.fileUrl ||
    data.file_url ||
    data.downloadUrl ||
    data.download_url ||
    data.storagePath ||
    data.storage_path ||
    data.src ||
    data.picture ||
    data.mediaUrl ||
    data.media_url ||
    data.cover ||
    data.coverImage ||
    '';

  const title =
    data.title ||
    data.heading ||
    data.name ||
    data.bannerTitle ||
    data.banner_title ||
    data.header ||
    data.label ||
    '';

  const subtitle =
    data.subtitle ||
    data.subTitle ||
    data.sub_title ||
    data.description ||
    data.desc ||
    data.bannerSubtitle ||
    data.banner_subtitle ||
    data.details ||
    data.info ||
    '';

  const buttonText =
    data.buttonText ||
    data.button_text ||
    data.btnText ||
    data.btn_text ||
    data.ctaText ||
    data.cta_text ||
    data.actionText ||
    data.bannerButtonText ||
    'Explore Now';

  const buttonUrl =
    data.buttonUrl ||
    data.button_url ||
    data.link ||
    data.url ||
    data.targetUrl ||
    data.target_url ||
    data.bannerUrl ||
    data.banner_url ||
    data.href ||
    '';

  const actionType =
    data.actionType ||
    data.action_type ||
    data.type ||
    (buttonUrl.startsWith('http') ? 'link' : undefined);

  const isPublished =
    data.published !== false &&
    data.status !== 'draft' &&
    data.status !== 'inactive' &&
    data.active !== false &&
    data.isActive !== false &&
    data.visible !== false &&
    data.isVisible !== false;

  return {
    id,
    title,
    subtitle,
    image,
    buttonText,
    buttonUrl,
    buttonVisible: data.buttonVisible !== false && data.showButton !== false,
    actionType: (actionType as any) || 'link',
    actionTargetId: data.actionTargetId || data.targetId || data.subjectId || data.topicId,
    badge: data.badge || data.tag || data.category || '',
    order: data.order ?? data.position ?? data.priority ?? 0,
    published: isPublished,
    ...data,
  };
}

/**
 * Real-time subscription to banners across all potential collections and admin configurations
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
        if (!seenIds.has(b.id) && b.published !== false && (b.title || b.image || b.subtitle)) {
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
          if (!seenIds.has(norm.id) && norm.published !== false && (norm.title || norm.image || norm.subtitle)) {
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

    // Send only real configured banners (empty array if no banners added)
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

  // Common Admin collection names for banners
  const collectionNames = [
    'banners',
    'banner',
    'heroBanners',
    'hero_banners',
    'homeBanners',
    'home_banners',
    'promotions',
    'sliders',
    'slider',
    'advertisements',
    'ads',
  ];

  collectionNames.forEach(name => attachListener(name));

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
