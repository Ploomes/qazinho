import type { TargetKind } from '@/shared/types';

const SETTINGS_WORDS = new Set([
  'www',
  'app',
  'staging',
  'stage',
  'stg',
  'dev',
  'develop',
  'hml',
  'homolog',
  'homologacao',
  'qa',
  'test',
  'testing',
  'preview',
  'beta',
  'sandbox',
]);

const DOMAIN_WORDS = new Set(['com', 'co', 'org', 'net', 'gov', 'edu', 'app', 'dev']);

/**
 * O nome de um projeto novo pelo que ele testa: o nome do site, sem ambiente nem domínio,
 * ou o do build, sem a versão.
 */
export function projectNameOf(target: { kind: TargetKind; value: string }): string {
  return target.kind === 'web' ? siteNameOf(target.value) : buildNameOf(target.value);
}

function siteNameOf(address: string): string {
  try {
    const url = new URL(address);
    const labels = url.hostname.split('.');

    if (labels.length === 1 || /^[\d.]+$/.test(url.hostname)) return url.host;

    const named = labels.slice(0, -1);

    while (named.length > 1 && DOMAIN_WORDS.has(named.at(-1) ?? '')) named.pop();

    const kept = named.filter((label) => !SETTINGS_WORDS.has(label));

    return wordsOf(kept.at(-1) ?? named.at(-1) ?? url.host);
  } catch {
    return address;
  }
}

function buildNameOf(path: string): string {
  const file = path.split(/[\\/]/).at(-1) ?? path;
  const bare = file.replace(/\.(apk|app)$/i, '').replace(/[-_ ]?v?\d+(\.\d+)*$/i, '');

  return wordsOf(bare === '' ? file : bare);
}

function wordsOf(text: string): string {
  const spaced = text.replace(/[-_]+/g, ' ').trim();

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
