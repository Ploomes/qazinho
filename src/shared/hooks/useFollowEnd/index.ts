import { useEffect, useLayoutEffect, useRef } from 'react';
import { FOLLOW_END } from './constants';
import { followsEndAfter } from './library';

export const useFollowEnd = <T extends HTMLElement>(props: {
  resetKey: string | null;
  callKey?: string | null;
  isOn?: boolean;
}) => {
  const { resetKey, callKey = null, isOn = true } = props;
  const listRef = useRef<T>(null);
  const isFollowing = useRef(true);
  const previousTop = useRef(0);

  useLayoutEffect(() => {
    const list = listRef.current;

    isFollowing.current = isOn;

    if (list && isOn) {
      list.scrollTop = list.scrollHeight;
      previousTop.current = list.scrollTop;
    }
  }, [resetKey, isOn]);

  useLayoutEffect(() => {
    if (callKey === null) return;

    isFollowing.current = true;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [callKey]);

  useEffect(() => {
    const list = listRef.current;

    if (!list || typeof MutationObserver === 'undefined') return;

    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (isFollowing.current)
          list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      });
    });

    observer.observe(list, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [resetKey]);

  return {
    listRef,
    onFollowScroll: () => {
      const list = listRef.current;

      if (!list) return;

      isFollowing.current = followsEndAfter({
        wasFollowing: isFollowing.current,
        top: list.scrollTop,
        previousTop: previousTop.current,
        clientHeight: list.clientHeight,
        scrollHeight: list.scrollHeight,
        edgePx: FOLLOW_END.edgePx,
      });
      previousTop.current = list.scrollTop;
    },
  };
};
