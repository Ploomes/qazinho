import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FACE_HOP,
  FACE_SWAP,
} from '@/modules/Assistant/components/AssistantButton/constants';
import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';
import { Platform } from '@/services';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';
import { useAssistantStore, useSettingsStore } from '@/store';

export const useAssistantButtonViewModel = () => {
  const { t } = useTranslation();
  const isOpen = useAssistantStore((state) => state.isOpen);
  const isAsking = useAssistantStore((state) => state.isAsking);
  const unread = useAssistantStore((state) => state.unread);
  const isSpeaking = useAssistantStore((state) => state.tip !== null);
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
    className: [
      'assistant-button',
      ...(isOpen ? ['assistant-button--open'] : []),
      ...(isSpeaking ? ['assistant-button--speaking'] : []),
    ].join(' '),
    faceMotion: isSpeaking ? FACE_HOP : FACE_SWAP.animate,
    style: {
      '--assistant-button': `${String(ASSISTANT_DOCK.buttonSize)}px`,
      '--assistant-badge': `${String(ASSISTANT_DOCK.badgeSize)}px`,
      '--assistant-badge-offset': `${String(ASSISTANT_DOCK.badgeOffset)}px`,
      '--assistant-ring': `${String(ASSISTANT_DOCK.speakingRing)}px`,
    } as CSSProperties,
    label,
    tip:
      combo === null
        ? label
        : `${label} · ${comboLabelOf({ combo, isMac: Platform.isMac() })}`,
    mood: isAsking
      ? ('thinking' as const)
      : unread > 0
        ? ('passed' as const)
        : ('neutral' as const),
    isStill: !isAsking && !isSpeaking,
    faceSize: ASSISTANT_DOCK.faceSize,
    badge: unread === 0 || isOpen ? null : String(unread),
    badgeLabel:
      unread === 1
        ? t('ASSISTANT.UNREAD_ONE')
        : t('ASSISTANT.UNREAD_OTHER', { count: unread }),
    onClick: toggle,
  };
};
