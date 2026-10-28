import type { ChatItem } from '@/modules/Chat/types';

/**
 * Dá à run em andamento a linha dela no fim do chat antes de ela dizer qualquer coisa,
 * para o QA a ver andar desde o começo.
 */
export function withLiveRun(props: {
  items: ChatItem[];
  liveId: string | null;
  at: string;
}): ChatItem[] {
  const { items, liveId, at } = props;

  if (liveId === null) return items;

  if (items.some((item) => item.kind === 'run' && item.runId === liveId)) return items;

  return [
    ...items,
    { kind: 'run', runId: liveId, at, messages: [], card: null, isNew: true },
  ];
}
