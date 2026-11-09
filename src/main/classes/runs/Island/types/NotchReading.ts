import type { INotch } from './INotch';

/** O que se sabe do notch da tela: as medidas, que ela não tem, ou nada ainda. */
export type NotchReading = INotch | null | 'unknown';
