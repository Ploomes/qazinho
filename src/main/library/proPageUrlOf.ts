/**
 * The address of a page of QAzinho Pro's site from a path the page asked for; null for
 * one that would leave the site.
 */
export function proPageUrlOf(props: { base: string; path: string }): string | null {
  const { base, path } = props;

  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;

  try {
    const site = new URL(base);
    const page = new URL(path, site);

    return page.origin === site.origin ? page.toString() : null;
  } catch {
    return null;
  }
}
