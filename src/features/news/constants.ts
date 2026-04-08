export const NEWS_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type NewsStatus = (typeof NEWS_STATUSES)[number];
