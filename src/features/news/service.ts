// News service - Firestore implementation pending
// News model not yet migrated to Firestore

import { NEWS_STATUSES } from "./constants";

export async function createNewsPost(input: {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  authorId: string;
}) {
  // Placeholder - will be implemented after migration
  return null;
}

export async function listNewsPosts(limit = 20) {
  // Placeholder - will be implemented after migration
  return [];
}

export async function listPublishedNewsPosts(limit = 20) {
  // Placeholder - will be implemented after migration
  return [];
}

export async function getNewsPostBySlug(slug: string) {
  // Placeholder - will be implemented after migration
  return null;
}

export async function updateNewsPost(id: string, input: {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  status?: (typeof NEWS_STATUSES)[number];
}) {
  // Placeholder - will be implemented after migration
  return null;
}

export async function deleteNewsPost(id: string) {
  // Placeholder - will be implemented after migration
  return null;
}
