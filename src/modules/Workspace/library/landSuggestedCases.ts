import type { IWorkspace } from '@/modules/Workspace/types';
import type { IDraftedCase } from '@/shared/types';

/** Casos que um agente de fora sugeriu, num cartão no chat até o QA levá-los ao plano. */
export function landSuggestedCases(props: {
  workspace: IWorkspace;
  summary: string;
  cases: IDraftedCase[];
  at: string;
}): IWorkspace {
  const { workspace, summary, cases, at } = props;

  return {
    ...workspace,
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'suggestion',
        at,
        runId: '',
        summary,
        cases,
        isTaken: false,
        from: 'outside',
      },
    ],
  };
}
