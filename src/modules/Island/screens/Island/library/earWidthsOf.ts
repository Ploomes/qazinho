import { ISLAND_SHAPE } from '@/modules/Island/screens/Island/constants';

/**
 * A largura de cada orelha, só com o que ela mostra: o Estagiário à esquerda, o ícone e o
 * contador à direita.
 */
export function earWidthsOf(count: string): { left: number; right: number } {
  return {
    left: ISLAND_SHAPE.padPx + ISLAND_SHAPE.internPx,
    right:
      ISLAND_SHAPE.padPx +
      ISLAND_SHAPE.iconPx +
      (count === '' ? 0 : count.length * ISLAND_SHAPE.countCharPx + ISLAND_SHAPE.gapPx),
  };
}
