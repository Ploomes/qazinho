import type { CSSProperties } from 'react';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { useAssistantStore } from '@/store';

export const useAssistantDockViewModel = () => {
  const isOpen = useAssistantStore((state) => state.isOpen);

  return {
    isOpen,
    style: {
      '--assistant-button': `${String(ASSISTANT_DOCK.buttonSize)}px`,
      '--assistant-badge': `${String(ASSISTANT_DOCK.badgeSize)}px`,
      '--assistant-badge-offset': `${String(ASSISTANT_DOCK.badgeOffset)}px`,
      '--assistant-panel-width': `${String(ASSISTANT_DOCK.panelWidth)}px`,
      '--assistant-panel-height': `${String(ASSISTANT_DOCK.panelHeight)}px`,
      '--assistant-top-clear': `${String(ASSISTANT_DOCK.topClear)}px`,
      '--assistant-rise': `${String(ASSISTANT_DOCK.rise)}px`,
      '--assistant-inset': `${String(ASSISTANT_DOCK.inset)}px`,
    } as CSSProperties,
  };
};
