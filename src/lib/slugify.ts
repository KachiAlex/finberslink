const NON_ALPHANUMERIC = /[^a-z0-9]+/gi;

export function slugify(value: string, fallback = "item") {
  const base = value?.trim().length ? value : fallback;
  return base
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}
