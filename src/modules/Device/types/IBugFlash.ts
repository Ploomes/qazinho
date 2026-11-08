import type { BugCategory, IScreenBox } from '@/shared/types';

/** Um bug recém-pego como a tela do dispositivo o mostra por alguns segundos. */
export interface IBugFlash {
  id: string;
  bugId: string;
  shot: string | null;
  title: string;
  category: BugCategory | null;
  isDesign: boolean;
  isSeenAgain: boolean;
  isQuiet: boolean;
  box: IScreenBox | null;
}
