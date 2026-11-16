import type { IShownTip } from './IShownTip';
import type { ReactNode } from 'react';

/**
 * O painel de dica que o app divide: a dica à mostra, a vez dele, que só muda quando ele
 * abre do zero, e quando a última fechou.
 */
export interface ITooltipStore {
  tip: IShownTip | null;
  session: number;
  closedAt: number;
  lingerTimer: ReturnType<typeof setTimeout> | null;
  show: (tip: IShownTip) => void;
  update: (args: { id: string; content: ReactNode }) => void;
  hide: (args: { id: string; isGroupHovered: boolean }) => void;
  isWarm: (now: number) => boolean;
}
