import type { BuildPlatform } from '@/shared/types';

const NEVER = /unsigned|androidTest|-iphoneos[\\/]/i;

const RELEASE = /[\\/]outputs[\\/]apk[\\/]release[\\/]|Release-iphonesimulator[\\/]/;

const OUTPUT = /[\\/]outputs[\\/](apk|flutter-apk)[\\/]|-iphonesimulator[\\/]/;

/**
 * O .apk ou .app de simulador que um build provavelmente quis dizer, dentre o que deixou:
 * uma pasta de saída conhecida primeiro, depois o mais novo.
 */
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

function rankOf(path: string): number {
  if (NEVER.test(path)) return 0;

  if (RELEASE.test(path)) return 3;

  return OUTPUT.test(path) ? 2 : 1;
}
