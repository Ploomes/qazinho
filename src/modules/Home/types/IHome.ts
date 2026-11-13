import type { IHomeAnswered } from './IHomeAnswered';
import type { IHomeArrived } from './IHomeArrived';
import type { IHomeAsking } from './IHomeAsking';
import type { IHomeByHand } from './IHomeByHand';
import type { IHomeFailed } from './IHomeFailed';
import type { IHomePaused } from './IHomePaused';
import type { IHomeRecent } from './IHomeRecent';
import type { IHomeRunning } from './IHomeRunning';
import type { IHomeToContinue } from './IHomeToContinue';
import type { IHomeToDevelop } from './IHomeToDevelop';

/** O que o Início mostra, de todos os projetos, cada grupo na ordem em que pede o QA. */
export interface IHome {
  asking: IHomeAsking[];
  going: (IHomeRunning | IHomePaused)[];
  toContinue: IHomeToContinue[];
  failed: IHomeFailed[];
  arrived: IHomeArrived[];
  answered: IHomeAnswered[];
  byHand: IHomeByHand[];
  toDevelop: IHomeToDevelop[];
  recent: IHomeRecent[];
}
