import type { BuildPlatform } from '@/shared/types';

/**
 * O nome pelo qual um build guardado é conhecido: o repositório, a branch e o commit de
 * onde veio.
 */
export function artifactNameOf(props: {
  repository: string;
  branch: string;
  commit: string;
  platform: BuildPlatform;
}): string {
  const slug = (text: string) => text.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');

  return `${slug(props.repository)}-${slug(props.branch)}-${props.commit.slice(0, 7)}.${props.platform === 'android' ? 'apk' : 'app'}`;
}
