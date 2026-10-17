import type { IWorkspace } from '@/modules/Workspace';

export function answerAsk(props: {
  workspace: IWorkspace;
  reply: string;
  at: string;
}): IWorkspace {
  const { workspace, reply, at } = props;
  const withoutAsk = workspace.chat.filter((message) => message.kind !== 'ask');

  return {
    ...workspace,
    status: 'idle',
    chat: [
      ...withoutAsk,
      { id: `m-${String(withoutAsk.length + 1)}`, kind: 'user', at, text: reply },
    ],
  };
}
