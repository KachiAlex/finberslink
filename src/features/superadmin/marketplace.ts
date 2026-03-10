const bundles = [
  {
    key: "ai-coaching",
    title: "AI Coaching Suite",
    description: "Automated resume, cover letter, and interview coaching for students & tutors.",
    price: "$499 / month",
    badge: "Pilot",
  },
  {
    key: "jobs-sync",
    title: "Jobs Sync Accelerator",
    description: "Mirror approved jobs to partner boards and push real-time alerts.",
    price: "$299 / month",
    badge: "New",
  },
  {
    key: "guardian-monitoring",
    title: "Guardian Monitoring",
    description: "Fraud detection across payouts and invite flows with escalation workflows.",
    price: "$199 / month",
    badge: "Beta",
  },
];

const enabledBundles = new Set<string>();

export function listMarketplaceBundles() {
  return bundles.map((bundle) => ({
    ...bundle,
    enabled: enabledBundles.has(bundle.key),
  }));
}

export async function enableMarketplaceBundle(key: string) {
  if (!bundles.some((bundle) => bundle.key === key)) {
    throw new Error("Unknown marketplace bundle");
  }

  enabledBundles.add(key);
  return { key, enabled: true };
}
