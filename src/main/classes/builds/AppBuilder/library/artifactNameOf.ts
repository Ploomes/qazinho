import type { BuildPlatform } from '@/shared/types';

/** The name a kept build goes by: the repository, the branch and the commit it came from. */
export function artifactNameOf(props: {
  repository: string;
  branch: string;
  commit: string;
  platform: BuildPlatform;
}): string {
  const slug = (text: string) => text.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');

  return `${slug(props.repository)}-${slug(props.branch)}-${props.commit.slice(0, 7)}.${props.platform === 'android' ? 'apk' : 'app'}`;
}
