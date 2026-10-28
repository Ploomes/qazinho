import type { ICommandPart } from './ICommandPart';

/**
 * O chip de comando no composer: o comando, o que nomeia até agora, e o que o campo pede
 * em seguida.
 */
export interface IComposerCommand {
  name: string;
  parts: ICommandPart[];
  isReady: boolean;
  placeholder: string;
}
