import type { ChatMessage } from '@/modules/Chat/types';
import { useLayoutEffect, useRef, useState } from 'react';
import { CHAT_SCROLL } from '@/modules/Chat/screens/Chat/constants';
import { isNearBottom, isNearTop } from '@/modules/Chat/screens/Chat/library';

export const useChatScroll = (props: {
  workspaceId: string | null;
  messages: ChatMessage[];
  isAgentTyping: boolean;
}) => {
  const { workspaceId, messages, isAgentTyping } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const followsEnd = useRef(true);
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

    followsEnd.current = true;

    if (list) list.scrollTop = list.scrollHeight;
  }, [workspaceId]);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (list && followsEnd.current)
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isAgentTyping]);

  useLayoutEffect(() => {
    const list = listRef.current;

    if (list && fromBottom.current !== null) {
      list.scrollTop = list.scrollHeight - fromBottom.current;
      fromBottom.current = null;
    }
  }, [count]);

  return {
    listRef,
    visible: messages.slice(start).map((message, index) => ({
      message,
      isNew: start + index >= firstNew,
    })),
    onScroll: () => {
      const list = listRef.current;

      if (!list) return;

      followsEnd.current = isNearBottom({
        scrollTop: list.scrollTop,
        clientHeight: list.clientHeight,
        scrollHeight: list.scrollHeight,
        edgePx: CHAT_SCROLL.edgePx,
      });

      if (start === 0 || fromBottom.current !== null) return;
      if (!isNearTop({ scrollTop: list.scrollTop, edgePx: CHAT_SCROLL.edgePx })) return;

      fromBottom.current = list.scrollHeight - list.scrollTop;
      setShown({ workspaceId, count: count + CHAT_SCROLL.page });
    },
  };
};
