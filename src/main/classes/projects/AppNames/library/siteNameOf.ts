import { APP_NAMES } from '@/main/classes/projects/AppNames/constants';

const NAMED_BY = ['og:site_name', 'application-name', 'apple-mobile-web-app-title'];

const GENERIC = new Set([
  'home',
  'início',
  'inicio',
  'página inicial',
  'login',
  'log in',
  'sign in',
  'entrar',
  'dashboard',
  'painel',
  'welcome',
  'bem-vindo',
  'bem vindo',
  'react app',
  'vite app',
  'vite + react',
  'vite + react + ts',
  'create next app',
  'next.js',
  'expo',
  'document',
  'untitled',
  'localhost',
]);

/**
 * O nome de um site pela página: o que ele diz ser, senão o título sem a parte da página
 * nem um título de exemplo; null quando ela não diz.
 */
export function siteNameOf(html: string): string | null {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributesOf(tag));

  for (const wanted of NAMED_BY) {
    const named = metas.find(
      (meta) => (meta.property ?? meta.name ?? '').toLowerCase() === wanted,
    )?.content;
    const name = namedOf(named ?? '');

    if (name !== null) return name;
  }

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '';
  const parts = decoded(title)
    .split(/\s[|–—·•:-]\s|\s*[|–—·•]\s*/)
    .map((part) => part.trim())
    .filter((part) => part !== '' && !GENERIC.has(part.toLowerCase()));
  const [shortest] = [...parts].sort((a, b) => a.length - b.length);

  return namedOf(shortest ?? '');
}

function attributesOf(tag: string): Record<string, string> {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
      ([, key = '', double, single]) => [key.toLowerCase(), double ?? single ?? ''],
    ),
  );
}

function namedOf(text: string): string | null {
  const name = decoded(text).replace(/\s+/g, ' ').trim();

  return name === '' || name.length > APP_NAMES.longest || GENERIC.has(name.toLowerCase())
    ? null
    : name;
}

function decoded(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
