import type { CSSProperties } from 'react';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { useAssistantStore } from '@/store';

export const useAssistantDockViewModel = () => {
  const isOpen = useAssistantStore((state) => state.isOpen);

  return {
    isOpen,
    style: {
      '--assistant-panel-width': `${String(ASSISTANT_DOCK.panelWidth)}px`,
      '--assistant-panel-height': `${String(ASSISTANT_DOCK.panelHeight)}px`,
      '--assistant-top': `${String(ASSISTANT_DOCK.top)}px`,
      '--assistant-inset': `${String(ASSISTANT_DOCK.inset)}px`,
    } as CSSProperties,
  };
};
