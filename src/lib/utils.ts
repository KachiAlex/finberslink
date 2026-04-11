export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString();
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString();
}
