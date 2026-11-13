import type { IHome } from '@/modules/Home/types';

/** Quantas coisas do Início esperam o QA: perguntas, paradas, falhas e casos à mão. */
export function homeCountOf(home: IHome): number {
  return (
    home.asking.length + home.toContinue.length + home.failed.length + home.byHand.length
  );
}
