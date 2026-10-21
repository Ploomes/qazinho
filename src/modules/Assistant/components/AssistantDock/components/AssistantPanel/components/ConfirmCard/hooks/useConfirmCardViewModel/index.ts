import type { IConfirmCardProps } from '@/modules/Assistant/components/AssistantDock/components/AssistantPanel/components/ConfirmCard/types';
import { useTranslation } from 'react-i18next';
import { CONFIRM_TEXTS } from '@/modules/Assistant/constants';
import { useAssistantStore } from '@/store';

export const useConfirmCardViewModel = (props: IConfirmCardProps) => {
  const { message } = props;
  const { t } = useTranslation();
  const settleConfirm = useAssistantStore((state) => state.settleConfirm);
  const texts = CONFIRM_TEXTS[message.action];
  const isOpen = message.decision === null;

  return {
    title: t(texts.title, { subject: message.subject }),
    body:
      message.action === 'delete_workspace'
        ? t('ASSISTANT.CONFIRM_DELETE_WORKSPACE_BODY')
        : message.action === 'disconnect_integration'
          ? t('ASSISTANT.CONFIRM_DISCONNECT_BODY')
          : message.count === 0
            ? t('ASSISTANT.CONFIRM_DELETE_PROJECT_BODY_NONE')
            : message.count === 1
              ? t('ASSISTANT.CONFIRM_DELETE_PROJECT_BODY_ONE')
              : t('ASSISTANT.CONFIRM_DELETE_PROJECT_BODY_OTHER', {
                  count: message.count,
                }),
    goLabel: t(texts.go),
    keepLabel: t('ASSISTANT.KEEP'),
    isOpen,
    className: `confirm-card confirm-card--${message.decision ?? 'open'}`,
    result:
      message.decision === 'confirmed'
        ? t(texts.gone)
        : message.decision === 'kept'
          ? t('ASSISTANT.KEPT')
          : t('ASSISTANT.EXPIRED'),
    glyph:
      message.decision === 'confirmed' ? '✓' : message.decision === 'kept' ? '↺' : '–',
    onGo: () => {
      if (isOpen) settleConfirm({ id: message.id, decision: 'confirmed' });
    },
    onKeep: () => {
      if (isOpen) settleConfirm({ id: message.id, decision: 'kept' });
    },
  };
};
