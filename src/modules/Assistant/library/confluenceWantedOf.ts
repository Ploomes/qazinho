/**
 * What the QA named a Confluence page by: its id and title out of a page's link, or the
 * title they typed.
 */
export function confluenceWantedOf(text: string): { id: string | null; title: string } {
  const link = /\/pages\/(\d+)(?:\/([^/?#]+))?/.exec(text);

  if (link === null) return { id: null, title: text.trim() };

  const slug = link[2] ?? '';

  return {
    id: link[1] ?? null,
    title: decodeURIComponent(slug.replace(/\+/g, ' ')).trim(),
  };
}
