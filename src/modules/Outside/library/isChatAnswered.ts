import type { IWorkspace } from '@/modules/Workspace';

/**
 * Se o agente do chat terminou de responder à última mensagem do agente de código: ele
 * parou, e disse algo, escreveu o plano, perguntou ou falhou depois dela.
 */
export function isChatAnswered(props: {
  workspace: IWorkspace;
  isAnswering: boolean;
}): boolean {
  if (props.isAnswering) return false;

  const { chat } = props.workspace;
  const asked = chat.findLastIndex((message) => message.kind === 'user');

  return (
    chat[asked]?.kind === 'user' &&
    chat[asked].from === 'agent' &&
    chat
      .slice(asked + 1)
      .some(
        ({ kind }) =>
          kind === 'agent' || kind === 'plan' || kind === 'questions' || kind === 'error',
      )
  );
}
