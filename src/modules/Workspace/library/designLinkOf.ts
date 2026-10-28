import type { IDesignLink } from '@/shared/types';

const DESIGN_PATH =
  /^\/(?:design|file|proto)\/([\w-]+)(?:\/branch\/([\w-]+))?(?:\/([^/]+))?/;

/**
 * O design do Figma para o qual um link aponta: o arquivo, ou a branch que o link abre, e
 * o frame ou a página que o node-id dele nomeia; null para o que não é design do Figma.
 */
export function designLinkOf(text: string): IDesignLink | null {
  let url: URL;

  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || !/^(www\.)?figma\.com$/.test(url.hostname))
    return null;

  const read = DESIGN_PATH.exec(url.pathname);

  if (!read) return null;

  const [, fileKey = '', branchKey, slug] = read;
  const node = url.searchParams.get('node-id');

  return {
    url: url.toString(),
    fileKey: branchKey ?? fileKey,
    nodeId: node === null || node === '' ? null : node.replace('-', ':'),
    name: nameOf(slug) || fileKey,
  };
}

function nameOf(slug: string | undefined): string {
  try {
    return decodeURIComponent(slug ?? '')
      .replace(/-/g, ' ')
      .trim();
  } catch {
    return '';
  }
}
