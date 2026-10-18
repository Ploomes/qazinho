import type { ChatItem } from '@/modules/Chat/types';

/** Gives the run going its line at the end of the chat before it has said anything, so the QA sees it walk from the start. */
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
