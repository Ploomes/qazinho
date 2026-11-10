import type { ChatMessage } from '@/modules/Chat/types';
import { useLayoutEffect, useRef, useState } from 'react';
import { CHAT_SCROLL } from '@/modules/Chat/screens/Chat/constants';
import { isNearTop } from '@/modules/Chat/screens/Chat/library';
import { useFollowEnd } from '@/shared/hooks/useFollowEnd';

export const useChatScroll = (props: {
  workspaceId: string | null;
  messages: ChatMessage[];
  questionId?: string | null;
}) => {
  const { workspaceId, messages, questionId = null } = props;
  const sentId = messages.filter(({ kind }) => kind === 'user').at(-1)?.id ?? null;
  const { listRef, onFollowScroll } = useFollowEnd<HTMLDivElement>({
    resetKey: workspaceId,
    callKey:
      questionId === null && sentId === null
        ? null
        : `${questionId ?? ''}|${sentId ?? ''}`,
  });
  const fromBottom = useRef<number | null>(null);
  const [shown, setShown] = useState<{ workspaceId: string | null; count: number }>({
    workspaceId,
    count: CHAT_SCROLL.page,
  });
  const [openedAt, setOpenedAt] = useState({ workspaceId, total: messages.length });

  const count = shown.workspaceId === workspaceId ? shown.count : CHAT_SCROLL.page;
  const firstNew =
    openedAt.workspaceId === workspaceId ? openedAt.total : messages.length;

  if (openedAt.workspaceId !== workspaceId)
    setOpenedAt({ workspaceId, total: messages.length });

  const start = Math.max(0, messages.length - count);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (list && fromBottom.current !== null) {
      list.scrollTop = list.scrollHeight - fromBottom.current;
      fromBottom.current = null;
    }
  }, [count, listRef]);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (!list || start === 0 || list.clientHeight === 0) return;
    if (list.scrollHeight > list.clientHeight) return;

    setShown({ workspaceId, count: count + CHAT_SCROLL.page });
  }, [count, listRef, start, workspaceId]);

  return {
    listRef,
    visible: messages.slice(start).map((message, index) => ({
      message,
      isNew: start + index >= firstNew,
    })),
    onScroll: () => {
      const list = listRef.current;

      if (!list) return;

      onFollowScroll();

      if (start === 0 || fromBottom.current !== null) return;
      if (!isNearTop({ scrollTop: list.scrollTop, edgePx: CHAT_SCROLL.edgePx })) return;

      fromBottom.current = list.scrollHeight - list.scrollTop;
      setShown({ workspaceId, count: count + CHAT_SCROLL.page });
    },
  };
};
