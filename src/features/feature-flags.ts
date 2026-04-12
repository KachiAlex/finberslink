export async function listFeatureFlags() {
  return [];
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  return { key, enabled };
}
