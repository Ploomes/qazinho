/**
 * Splits each PATH by the platform's own separator and keeps the first mention of each
 * directory: a hydrated PATH may repeat what the app already had.
 */
export function mergePathSegments(props: {
  segments: (string | undefined)[];
  platform: NodeJS.Platform;
}): string[] {
  const seen = new Set<string>();
  const separator = props.platform === 'win32' ? ';' : ':';

  return props.segments
    .filter((segment): segment is string => segment !== undefined && segment.length > 0)
    .flatMap((segment) => segment.split(separator))
    .map((directory) => directory.trim().replace(/^"(.*)"$/, '$1'))
    .filter((directory) => {
      const key = props.platform === 'win32' ? directory.toLowerCase() : directory;

      if (directory.length === 0 || seen.has(key)) return false;

      seen.add(key);

      return true;
    });
}
