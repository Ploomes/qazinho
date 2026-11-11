import type { TargetKind } from '@/shared/types';

/**
 * O app que um projeto testa, como a barra lateral o mostra: o endereço do site, se tiver
 * um, a plataforma do primeiro alvo, e onde cada alvo roda.
 */
export interface IProjectApp {
  address: string | null;
  platform: TargetKind | null;
  places: string[];
}
