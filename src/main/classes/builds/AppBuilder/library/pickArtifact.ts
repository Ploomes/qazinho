import type { BuildPlatform } from '@/shared/types';

const NEVER = /unsigned|androidTest|-iphoneos\//i;
const RELEASE = /\/outputs\/apk\/release\/|Release-iphonesimulator\//;
const OUTPUT = /\/outputs\/(apk|flutter-apk)\/|-iphonesimulator\//;

function rankOf(path: string): number {
  if (NEVER.test(path)) return 0;

  if (RELEASE.test(path)) return 3;

  return OUTPUT.test(path) ? 2 : 1;
}

/** The .apk or simulator .app a build most likely meant, out of what it left: a known output folder first, then the newest. */
export function pickArtifact(props: {
  found: { path: string; modifiedMs: number }[];
  platform: BuildPlatform;
}): string | null {
  const extension = props.platform === 'android' ? '.apk' : '.app';
  const [best] = props.found
    .filter(({ path }) => path.endsWith(extension))
    .map((one) => ({ ...one, rank: rankOf(one.path) }))
    .filter(({ rank }) => rank > 0)
    .sort((a, b) => b.rank - a.rank || b.modifiedMs - a.modifiedMs);

  return best?.path ?? null;
}
