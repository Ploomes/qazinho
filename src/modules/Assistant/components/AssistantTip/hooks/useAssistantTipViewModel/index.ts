import type { IAssistantTipProps } from '@/modules/Assistant/components/AssistantTip/types';
import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ASSISTANT_TIP } from '@/modules/Assistant/components/AssistantTip/constants';
import { holdMsOf } from '@/modules/Assistant/components/AssistantTip/library';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { useAssistantStore } from '@/store';

export const useAssistantTipViewModel = (props: IAssistantTipProps) => {
  const { anchorRef } = props;
  const tip = useAssistantStore((state) => state.tip);
  const hush = useAssistantStore((state) => state.hush);
  const [heldId, setHeldId] = useState<string | null>(null);
  const [place, setPlace] = useState({ top: 0, right: 0 });

  const isHeld = tip !== null && heldId === tip.id;

  useEffect(() => {
    if (tip === null || isHeld) return;

    const timer = window.setTimeout(hush, holdMsOf(tip.text));

    return () => {
      window.clearTimeout(timer);
    };
  }, [tip, isHeld, hush]);

  useLayoutEffect(() => {
    if (tip === null) return;

    const measure = () => {
      const box = anchorRef.current?.getBoundingClientRect();

      if (box !== undefined)
        setPlace({ top: box.bottom, right: window.innerWidth - box.right });
    };

    measure();
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('resize', measure);
    };
  }, [tip, anchorRef]);

  return {
    tip,
    style: {
      '--assistant-tip-top': `${String(place.top)}px`,
      '--assistant-tip-right': `${String(place.right)}px`,
      '--assistant-tip-width': `${String(ASSISTANT_TIP.width)}px`,
      '--assistant-tip-tail': `${String(ASSISTANT_TIP.tail)}px`,
      '--assistant-tip-tail-right': `${String((ASSISTANT_DOCK.buttonSize - ASSISTANT_TIP.tail) / 2)}px`,
    } as CSSProperties,
    onClick: hush,
    onPointerEnter: () => {
      setHeldId(tip?.id ?? null);
    },
    onPointerLeave: () => {
      setHeldId(null);
    },
  };
};
