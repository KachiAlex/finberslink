const FULL_SECTIONS_TTL_MS = 30 * 1000;

type FullSectionsCacheEntry = {
  payload: unknown;
  expiresAt: number;
};

const fullSectionsCache = new Map<string, FullSectionsCacheEntry>();

export function getDashboardSectionsFullCache(userId: string) {
  const entry = fullSectionsCache.get(userId);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    fullSectionsCache.delete(userId);
    return null;
  }

  return entry.payload;
}

export function setDashboardSectionsFullCache(userId: string, payload: unknown) {
  fullSectionsCache.set(userId, {
    payload,
    expiresAt: Date.now() + FULL_SECTIONS_TTL_MS,
  });
}

export function invalidateDashboardSectionsFullCache(userId: string) {
  fullSectionsCache.delete(userId);
}
