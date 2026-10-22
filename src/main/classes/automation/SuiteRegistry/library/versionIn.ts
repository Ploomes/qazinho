/** The version a package.json says it is; null for text that is not one. */
export function versionIn(text: string): string | null {
  try {
    const read: unknown = JSON.parse(text);
    const version =
      typeof read === 'object' && read !== null && 'version' in read
        ? read.version
        : null;

    return typeof version === 'string' && version !== '' ? version : null;
  } catch {
    return null;
  }
}
