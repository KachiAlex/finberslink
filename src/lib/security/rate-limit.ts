export async function checkRateLimit(key: string, limit: number = 100) {
  // Placeholder for rate limiting
  return true;
}


export async function createRateLimit(key: string, limit: number, windowMs: number) {
  // Placeholder for creating rate limit
  return { key, limit, windowMs };
}

export const rateLimitPresets = {
  strict: { limit: 10, windowMs: 60000 },
  moderate: { limit: 100, windowMs: 60000 },
  relaxed: { limit: 1000, windowMs: 60000 },
};
