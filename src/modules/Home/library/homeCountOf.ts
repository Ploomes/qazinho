import type { IHome } from '@/modules/Home/types';

/** Quantas coisas do Início esperam o QA: perguntas, runs a continuar e falhas. */
export function homeCountOf(home: IHome): number {
  return home.asking.length + home.toContinue.length + home.failed.length;
}
