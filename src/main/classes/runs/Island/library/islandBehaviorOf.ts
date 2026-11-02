import type { IIslandBehavior } from '@/main/classes/runs/Island/types';

/**
 * Como a janela da ilha age em cada sistema: num Mac é um painel, que recebe teclado sem
 * tirar o foco do app do QA; o Linux não liga e desliga o foco depois de aberta.
 */
export function islandBehaviorOf(platform: NodeJS.Platform): IIslandBehavior {
  return {
    options: {
      focusable: platform === 'linux',
      ...(platform === 'darwin' ? { type: 'panel' as const } : {}),
    },
    togglesFocus: platform !== 'linux',
    joinsSpaces: platform !== 'win32',
  };
}
