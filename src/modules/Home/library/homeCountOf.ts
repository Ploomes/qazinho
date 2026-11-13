import type { IHome } from '@/modules/Home/types';

/**
 * Quantas coisas do Início esperam o QA: perguntas da run e do chat, paradas, falhas,
 * histórias que chegaram, foram respondidas ou mudaram, e casos à mão.
 */
export function homeCountOf(home: IHome): number {
  return (
    home.asking.length +
    home.toAnswer.length +
    home.toContinue.length +
    home.failed.length +
    home.arrived.length +
    home.answered.length +
    home.changed.length +
    home.byHand.length
  );
}
