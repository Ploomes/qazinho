import { siteOriginOf } from './siteOriginOf';

const LINK = /<link\b[^>]*>/gi;
const ATTRIBUTE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

/**
 * Os ícones que uma página declara, do mais nítido para o menor, e o /favicon.ico da
 * origem por último; vazio quando a página não é de um site.
 */
export function iconLinksIn(props: { html: string; page: string }): string[] {
  const origin = siteOriginOf(props.page);

  if (origin === null) return [];

  const declared = [...props.html.matchAll(LINK)]
    .map(([tag]) => attributesOf(tag))
    .filter((attributes) => isIconRel(attributes.rel ?? ''))
    .flatMap((attributes) => {
      const url = absoluteOf({ href: attributes.href ?? '', page: props.page });

      return url === null ? [] : [{ url, score: scoreOf({ attributes, url }) }];
    })
    .sort((a, b) => b.score - a.score)
    .map(({ url }) => url);

  return [...new Set([...declared, `${origin}/favicon.ico`])];
}

function attributesOf(tag: string): Record<string, string> {
  return Object.fromEntries(
    [...tag.matchAll(ATTRIBUTE)].map(([, name, double, single, bare]) => [
      (name ?? '').toLowerCase(),
      (double ?? single ?? bare ?? '').replaceAll('&amp;', '&').trim(),
    ]),
  );
}

function isIconRel(rel: string): boolean {
  const words = rel.toLowerCase().split(/\s+/);

  return (
    !words.includes('mask-icon') &&
    words.some((word) => word === 'icon' || word.startsWith('apple-touch-icon'))
  );
}

function absoluteOf(props: { href: string; page: string }): string | null {
  if (props.href === '' || props.href.startsWith('data:')) return null;

  try {
    const url = new URL(props.href, props.page);

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function scoreOf(props: { attributes: Record<string, string>; url: string }): number {
  const { attributes, url } = props;
  const largest = Math.max(
    0,
    ...(attributes.sizes ?? '')
      .split(/\s+/)
      .map((size) => Number.parseInt(size.split(/x/i)[0] ?? '', 10))
      .filter(Number.isFinite),
  );

  if (attributes.type === 'image/svg+xml' || /\.svg(\?|$)/i.test(url)) return 4;
  if ((attributes.rel ?? '').toLowerCase().includes('apple-touch-icon')) return 3;
  if (largest >= 32) return 2;

  return 1;
}
