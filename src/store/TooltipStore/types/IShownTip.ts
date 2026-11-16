import type { ITipBox } from './ITipBox';
import type { TipSide } from './TipSide';
import type { ReactNode } from 'react';

/**
 * A dica que o painel único mostra: de quem ela é, o grupo de vizinhos entre os quais ela
 * desliza, onde está o que ela nomeia, e o que ela diz.
 */
export interface IShownTip {
  id: string;
  group: Element | null;
  box: ITipBox;
  content: ReactNode;
  side: TipSide;
  isWide: boolean;
}
