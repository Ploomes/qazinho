import type { IIslandPlace } from '@/main/classes/runs/Island/types';
import type { Rectangle } from 'electron';
import { ISLAND_WINDOW } from '@/main/classes/runs/Island/constants';

/**
 * Onde a janela da ilha fica: colada no centro do topo da tela, com a altura da barra de
 * menus, que num Mac com notch é a do notch, e a largura dele; sem notch, largura 0.
 */
export function islandPlaceOf(props: {
  bounds: Rectangle;
  workArea: Rectangle;
  platform: NodeJS.Platform;
}): IIslandPlace {
  const { bounds, workArea, platform } = props;
  const bar = platform === 'darwin' ? workArea.y - bounds.y : 0;
  const isNotched = bar >= ISLAND_WINDOW.minNotchBarHeight;

  return {
    x: Math.round(bounds.x + bounds.width / 2 - ISLAND_WINDOW.width / 2),
    y: bounds.y,
    width: ISLAND_WINDOW.width,
    height: ISLAND_WINDOW.height,
    barHeight: bar > 0 ? bar : ISLAND_WINDOW.fallbackBarHeight,
    notchWidth: isNotched ? ISLAND_WINDOW.notchWidth : 0,
  };
}
