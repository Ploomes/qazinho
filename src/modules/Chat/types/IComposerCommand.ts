import type { ICommandPart } from './ICommandPart';

/** The command chip in the composer: the command, what it names so far, and what the field asks for next. */
export interface IComposerCommand {
  name: string;
  parts: ICommandPart[];
  isReady: boolean;
  placeholder: string;
}
