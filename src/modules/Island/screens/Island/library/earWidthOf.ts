import { ISLAND_SHAPE } from '@/modules/Island/screens/Island/constants';

/**
 * A largura de cada orelha: o Estagiário à esquerda, o ícone e o contador à direita; as
 * duas ficam iguais para o notch não sair do meio.
 */
export function earWidthOf(count: string): number {
  const right =
    ISLAND_SHAPE.iconPx +
    (count === '' ? 0 : count.length * ISLAND_SHAPE.countCharPx + ISLAND_SHAPE.gapPx);

  return ISLAND_SHAPE.padPx + Math.max(ISLAND_SHAPE.internPx, right);
}
