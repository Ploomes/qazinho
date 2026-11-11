/** A origem de um site, só de um endereço http ou https; null para o resto. */
export function siteOriginOf(address: string): string | null {
  try {
    const url = new URL(address);

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}
