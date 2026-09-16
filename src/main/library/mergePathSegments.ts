/** Keeps the first mention of each directory: a hydrated PATH may repeat what the app already had. */
export function mergePathSegments(segments: (string | undefined)[]): string[] {
  const seen = new Set<string>();

  return segments
    .filter((segment): segment is string => segment !== undefined && segment.length > 0)
    .flatMap((segment) => segment.split(':'))
    .map((directory) => directory.trim())
    .filter((directory) => {
      if (directory.length === 0 || seen.has(directory)) return false;

      seen.add(directory);

      return true;
    });
}
