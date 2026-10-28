/**
 * Pelo que o QA nomeou uma página do Confluence: o id e o título vindos do link de uma
 * página, ou o título que digitou.
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
