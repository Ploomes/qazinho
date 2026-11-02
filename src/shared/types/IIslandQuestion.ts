/** Uma pergunta na ilha: de que projeto e workspace veio, e como se responde a ela. */
export interface IIslandQuestion {
  workspaceId: string;
  questionId: string;
  project: string;
  workspace: string;
  question: string;
  options: string[];
  isSecret: boolean;
}
