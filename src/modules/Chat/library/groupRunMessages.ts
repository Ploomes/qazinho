import type { ChatItem, ChatMessage } from '@/modules/Chat/types';

function runIdOf(message: ChatMessage): string | null {
  if (message.kind === 'run' || message.kind === 'note' || message.kind === 'finding')
    return message.runId;

  if (message.kind === 'verdict' || message.kind === 'error') return message.runId;

  return null;
}

/** Keeps everything a kept or going run said in the chat together, where it began; what a run that never walked a step said stays loose. */
export function groupRunMessages(props: {
  messages: { message: ChatMessage; isNew: boolean }[];
  runIds: string[];
}): ChatItem[] {
  const items: ChatItem[] = [];
  const runs = new Map<string, Extract<ChatItem, { kind: 'run' }>>();

  for (const shown of props.messages) {
    const runId = runIdOf(shown.message);

    if (runId === null || !props.runIds.includes(runId)) {
      items.push({ kind: 'message', ...shown });
      continue;
    }

    const run = runs.get(runId);

    if (run === undefined) {
      const opened: Extract<ChatItem, { kind: 'run' }> = {
        kind: 'run',
        runId,
        at: shown.message.at,
        messages: [],
        card: null,
        isNew: shown.isNew,
      };

      runs.set(runId, opened);
      items.push(opened);
    }

    const into = runs.get(runId);

    if (into === undefined) continue;

    if (shown.message.kind === 'run') into.card = shown.message;
    else into.messages.push(shown);
  }

  return items;
}
