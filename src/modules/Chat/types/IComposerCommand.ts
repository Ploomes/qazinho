/** The command chip in the composer: the command, the repository and branch picked so far, and what the field asks for next. */
export interface IComposerCommand {
  name: string;
  repository: string | null;
  branch: string | null;
  isReady: boolean;
  placeholder: string;
}
