import type { IIslandPlace, NotchReading } from '@/main/classes/runs/Island/types';
import type { Rectangle } from 'electron';
import { ISLAND_WINDOW } from '@/main/classes/runs/Island/constants';

/**
 * Onde a janela da ilha fica: colada no centro do topo da tela, cobrindo o notch que o
 * macOS mediu; sem medida ainda, ele é deduzido da barra de menus.
 */
export function islandPlaceOf(props: {
  bounds: Rectangle;
  workArea: Rectangle;
  platform: NodeJS.Platform;
  notch: NotchReading;
}): IIslandPlace {
  const { bounds, workArea, platform, notch } = props;
  const bar = platform === 'darwin' ? workArea.y - bounds.y : 0;
  const barHeight = bar > 0 ? bar : ISLAND_WINDOW.fallbackBarHeight;
  const size =
    notch === 'unknown'
      ? {
          barHeight,
          notchWidth:
            bar >= ISLAND_WINDOW.minNotchBarHeight ? ISLAND_WINDOW.notchWidth : 0,
        }
      : notch === null
        ? { barHeight, notchWidth: 0 }
        : {
            barHeight: Math.max(
              barHeight,
              Math.ceil(notch.height) + ISLAND_WINDOW.notchCoverPx,
            ),
            notchWidth: Math.ceil(notch.width),
          };

  return {
    x: Math.round(bounds.x + bounds.width / 2 - ISLAND_WINDOW.width / 2),
    y: bounds.y,
    width: ISLAND_WINDOW.width,
    height: ISLAND_WINDOW.height,
    ...size,
  };
}
