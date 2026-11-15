import type { IWindowPlace } from '@salve-software/qazinho-harness/engine';

/** Onde o Chrome do caso e a coluna do QAzinho ficam na tela, lado a lado. */
export interface IDockPlaces {
  browser: IWindowPlace;
  app: IWindowPlace;
}
