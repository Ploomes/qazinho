import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { Platform } from '@/services';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';
import { useAssistantStore, useSettingsStore } from '@/store';

export const useAssistantButtonViewModel = () => {
  const { t } = useTranslation();
  const isOpen = useAssistantStore((state) => state.isOpen);
  const isAsking = useAssistantStore((state) => state.isAsking);
  const unread = useAssistantStore((state) => state.unread);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const toggle = useAssistantStore((state) => state.toggle);
  const combo = useSettingsStore(
    (state) => state.keybinds.find(({ id }) => id === 'assistant')?.combo ?? null,
  );
  const label = isOpen ? t('ASSISTANT.CLOSE') : t('ASSISTANT.OPEN');

  return {
    buttonRef,
    isOpen,
    isBusy: isAsking,
    className: isOpen ? 'assistant-button assistant-button--open' : 'assistant-button',
    style: {
      '--assistant-button': `${String(ASSISTANT_DOCK.buttonSize)}px`,
      '--assistant-badge': `${String(ASSISTANT_DOCK.badgeSize)}px`,
      '--assistant-badge-offset': `${String(ASSISTANT_DOCK.badgeOffset)}px`,
    } as CSSProperties,
    label,
    tip:
      combo === null
        ? label
        : `${label} (${comboLabelOf({ combo, isMac: Platform.isMac() })})`,
    mood: isAsking
      ? ('thinking' as const)
      : unread > 0
        ? ('passed' as const)
        : ('neutral' as const),
    isStill: !isAsking,
    faceSize: ASSISTANT_DOCK.faceSize,
    badge: unread === 0 || isOpen ? null : String(unread),
    badgeLabel:
      unread === 1
        ? t('ASSISTANT.UNREAD_ONE')
        : t('ASSISTANT.UNREAD_OTHER', { count: unread }),
    onClick: toggle,
  };
};
