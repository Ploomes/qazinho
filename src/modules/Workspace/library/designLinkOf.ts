import type { IDesignLink } from '@/shared/types';

const DESIGN_PATH =
  /^\/(?:design|file|proto)\/([\w-]+)(?:\/branch\/([\w-]+))?(?:\/([^/]+))?/;

function nameOf(slug: string | undefined): string {
  try {
    return decodeURIComponent(slug ?? '')
      .replace(/-/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

/** The Figma design a link points at: its file, or the branch the link opens, and the frame or page its node-id names; null for anything that is not a Figma design. */
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
