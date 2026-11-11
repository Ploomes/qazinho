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
  const intentAt = useRef(Number.NEGATIVE_INFINITY);
  const isPressing = useRef(false);
  const touchedAt = useRef(Number.NEGATIVE_INFINITY);
  const pressedTop = useRef(0);

  const reread = (props: { byUser: boolean }) => {
    const list = listRef.current;

    if (!list) return;

    isFollowing.current = followsEndAfter({
      wasFollowing: isFollowing.current,
      byUser: props.byUser,
      top: list.scrollTop,
      previousTop: previousTop.current,
      clientHeight: list.clientHeight,
      scrollHeight: list.scrollHeight,
      edgePx: FOLLOW_END.edgePx,
      leaveEdgePx: FOLLOW_END.leaveEdgePx,
    });
    previousTop.current = list.scrollTop;
  };

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
    touchedAt.current = Number.NEGATIVE_INFINITY;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [callKey]);

  useEffect(() => {
    const list = listRef.current;

    if (!list || typeof MutationObserver === 'undefined') return;

    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (performance.now() - touchedAt.current < FOLLOW_END.touchHoldMs) {
          isFollowing.current = false;

          return;
        }

        if (isFollowing.current)
          list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      });
    });
    const intend = () => {
      intentAt.current = performance.now();
    };
    const press = () => {
      isPressing.current = true;
      touchedAt.current = performance.now();
      pressedTop.current = list.scrollTop;
    };
    const release = () => {
      if (!isPressing.current) return;

      isPressing.current = false;

      if (list.scrollTop !== pressedTop.current)
        touchedAt.current = Number.NEGATIVE_INFINITY;

      previousTop.current = list.scrollTop;
      reread({ byUser: false });
    };

    observer.observe(list, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style'],
    });
    list.addEventListener('wheel', intend, { passive: true });
    list.addEventListener('touchmove', intend, { passive: true });
    list.addEventListener('keydown', intend);
    list.addEventListener('pointerdown', press);
    window.addEventListener('pointerup', release);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      list.removeEventListener('wheel', intend);
      list.removeEventListener('touchmove', intend);
      list.removeEventListener('keydown', intend);
      list.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
    };
  }, [resetKey, isOn]);

  return {
    listRef,
    onFollowScroll: () => {
      reread({
        byUser:
          isPressing.current ||
          performance.now() - intentAt.current < FOLLOW_END.intentMs,
      });
    },
  };
};
