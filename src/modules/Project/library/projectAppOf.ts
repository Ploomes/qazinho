import type { IProjectApp, ITarget } from '@/modules/Project/types';

/**
 * O app de um projeto pelos alvos dele: o primeiro site, para o ícone, a plataforma do
 * primeiro alvo, e cada lugar onde ele roda, o host de um site ou o nome do alvo.
 */
export function projectAppOf(targets: ITarget[]): IProjectApp {
  const site = targets.find(
    ({ kind, value }) => kind === 'web' && hostOf(value) !== null,
  );

  return {
    address: site?.value ?? null,
    platform: targets[0]?.kind ?? null,
    places: [
      ...new Set(
        targets.map(({ kind, value, label }) =>
          kind === 'web' ? (hostOf(value) ?? label) : label,
        ),
      ),
    ].filter((place) => place !== ''),
  };
}

function hostOf(value: string): string | null {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.host.replace(/^www\./, '')
      : null;
  } catch {
    return null;
  }
}
