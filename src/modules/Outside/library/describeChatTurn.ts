import type { IToolDone } from '@/modules/Assistant/types';
import type { IWorkspace } from '@/modules/Workspace';

/**
 * O que o agente do chat de um workspace disse desde a última mensagem mandada a ele:
 * as respostas, o plano, as perguntas que esperam, ou que ainda trabalha.
 */
export function describeChatTurn(props: {
  workspace: IWorkspace;
  isAnswering: boolean;
}): IToolDone {
  const { workspace, isAnswering } = props;
  const named = `${workspace.id} "${workspace.name}"`;
  const lastAsked = workspace.chat.map(({ kind }) => kind).lastIndexOf('user');
  const since = workspace.chat.slice(lastAsked + 1);
  const lines = since.flatMap((message): string[] => {
    if (message.kind === 'agent') return [`It answered: ${message.text}`];
    if (message.kind === 'plan')
      return [
        `It wrote the plan: ${String(message.caseCount)} cases, ${String(message.stepCount)} steps. Read them with workspace_details.`,
      ];
    if (message.kind === 'error') return [`It could not answer: ${message.text}`];
    if (message.kind === 'questions' && message.answers === null)
      return [
        "It waits on these questions; answer them with ask_workspace_chat, in the QA's place only when you know what they want:",
        ...message.questions.map(
          (question, index) =>
            `  ${String(index + 1)}. ${question.question} Options: ${question.options.map(({ label }) => label).join(' · ')}.`,
        ),
      ];

    return [];
  });

  if (isAnswering)
    return {
      text: [
        `QAzinho's agent in the chat of ${named} is still working on it. Call read_workspace_chat with waitSeconds to wait for its answer.`,
        ...lines,
      ].join('\n'),
      isError: false,
    };

  return {
    text:
      lastAsked === -1
        ? `Nobody wrote in the chat of ${named} yet.`
        : lines.length === 0
          ? `QAzinho's agent in the chat of ${named} said nothing since the last message.`
          : [`The chat of ${named}:`, ...lines].join('\n'),
    isError: false,
  };
}
