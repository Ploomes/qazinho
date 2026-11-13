import type { IHome } from '@/modules/Home/types';

/**
 * Quantas coisas do Início esperam o QA: perguntas, paradas, falhas, histórias que
 * chegaram ou foram respondidas, e casos à mão.
 */
export function homeCountOf(home: IHome): number {
  return (
    home.asking.length +
    home.toContinue.length +
    home.failed.length +
    home.arrived.length +
    home.answered.length +
    home.byHand.length
  );
}
