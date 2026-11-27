import type { IDockPlaces } from '@/main/classes/app/WindowDock/types';
import type { IWindowPlace } from '@ploomes/qazinho-harness/engine';
import { WINDOW_DOCK } from '@/main/classes/app/WindowDock/constants';

/**
 * Divide a área livre da tela: o Chrome do caso à esquerda e o QAzinho numa coluna à
 * direita, que só encolhe para o Chrome manter uma largura de site.
 */
export function dockOf(area: IWindowPlace): IDockPlaces {
  const room = area.width - WINDOW_DOCK.gap - WINDOW_DOCK.minBrowser;
  const column = Math.round(
    Math.min(WINDOW_DOCK.column, Math.max(WINDOW_DOCK.minColumn, room)),
  );
  const x = Math.round(area.x);
  const y = Math.round(area.y);
  const height = Math.round(area.height);

  return {
    browser: { x, y, width: Math.round(area.width) - column - WINDOW_DOCK.gap, height },
    app: { x: x + Math.round(area.width) - column, y, width: column, height },
  };
}
