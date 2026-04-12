/**
 * Utility function to combine classNames
 * Handles conditional classes and removes duplicates
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter((c) => typeof c === 'string')
    .join(' ')
    .split(' ')
    .filter((c) => c.length > 0)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .join(' ');
}
