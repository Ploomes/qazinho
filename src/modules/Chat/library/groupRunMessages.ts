import type { ChatItem, ChatMessage } from '@/modules/Chat/types';

type RunItem = Extract<ChatItem, { kind: 'run' }>;

/**
 * Mantém junto tudo o que uma run guardada ou em andamento disse no chat, onde ela
 * começou; o que disse uma run que nunca andou um passo fica solto.
 */
export function groupRunMessages(props: {
  messages: { message: ChatMessage; isNew: boolean }[];
  runIds: string[];
}): ChatItem[] {
  const items: ChatItem[] = [];
  const runs = new Map<string, RunItem>();

  const opened = (shown: { message: ChatMessage; isNew: boolean }, runId: string) => {
    const open = runs.get(runId);

    if (open !== undefined) return open;

    const run: RunItem = {
      kind: 'run',
      runId,
      at: shown.message.at,
      messages: [],
      card: null,
      isNew: shown.isNew,
    };

    runs.set(runId, run);
    items.push(run);

    return run;
  };

  for (const shown of props.messages) {
    const during = duringRunOf(shown.message);

    if (during !== null && props.runIds.includes(during)) opened(shown, during);

    const runId = runIdOf(shown.message);

    if (runId === null || !props.runIds.includes(runId)) {
      items.push({ kind: 'message', ...shown });
      continue;
    }

    const into = opened(shown, runId);

    if (shown.message.kind === 'run') into.card = shown.message;
    else into.messages.push(shown);
  }

  return items;
}

function duringRunOf(message: ChatMessage): string | null {
  return message.kind === 'user' ? (message.duringRun ?? null) : null;
}

function runIdOf(message: ChatMessage): string | null {
  if (
    message.kind === 'run' ||
    message.kind === 'note' ||
    message.kind === 'finding' ||
    message.kind === 'ask'
  )
    return message.runId;

  if (message.kind === 'verdict' || message.kind === 'error') return message.runId;

  return null;
}
