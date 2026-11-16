import type { ITipPlace } from '@/shared/components/organisms/TooltipLayer/types';
import type { ITipBox, TipSide } from '@/store/TooltipStore/types';
import { TIP_PLACE } from '@/shared/components/organisms/TooltipLayer/constants';

/**
 * Onde a dica de um tamanho fica ao lado do que nomeia, dentro da janela: à direita e
 * centrada nele, ou embaixo e alinhada pela direita dele, em cima quando falta espaço.
 */
export function tipPlaceOf(args: {
  box: ITipBox;
  size: { width: number; height: number };
  side: TipSide;
  viewport: { width: number; height: number };
}): ITipPlace {
  const { box, size, side, viewport } = args;
  const { width, height } = size;
  const centerX = box.left + box.width / 2;
  const centerY = box.top + box.height / 2;

  if (side === 'right') {
    const y = within(centerY - height / 2, [
      TIP_PLACE.edgePx,
      viewport.height - height - TIP_PLACE.edgePx,
    ]);

    return {
      x: box.right + TIP_PLACE.gapPx,
      y,
      width,
      height,
      tailX: 0,
      tailY: within(centerY - y, [TIP_PLACE.tailMinPx, height - TIP_PLACE.tailMinPx]),
      isAbove: false,
    };
  }

  const isAbove = box.bottom + TIP_PLACE.roomBelowPx > viewport.height;
  const fromRight = box.right - width;
  const x =
    fromRight >= TIP_PLACE.edgePx
      ? fromRight
      : within(box.left, [TIP_PLACE.edgePx, viewport.width - width - TIP_PLACE.edgePx]);

  return {
    x,
    y: isAbove ? box.top - TIP_PLACE.gapPx - height : box.bottom + TIP_PLACE.gapPx,
    width,
    height,
    tailX: within(centerX - x, [TIP_PLACE.tailMinPx, width - TIP_PLACE.tailMinPx]),
    tailY: isAbove ? height : 0,
    isAbove,
  };
}

function within(value: number, range: readonly [number, number]): number {
  return Math.min(Math.max(value, range[0]), Math.max(range[0], range[1]));
}
