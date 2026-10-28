/** A versão que um package.json diz ter; null para um texto que não é um. */
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
