export async function enableMarketplaceBundle(bundleId: string) {
  return { id: bundleId, enabled: true };
}

export async function listMarketplaceBundles() {
  return [];
}
