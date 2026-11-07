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
    title: t(texts.title, { subject: message.subject, detail: message.detail ?? '' }),
    body:
      message.action === 'update_project'
        ? (message.detail ?? '')
        : message.action === 'rename_workspace'
          ? ''
          : message.action === 'dismiss_bug'
            ? t('ASSISTANT.CONFIRM_DISMISS_BUG_BODY')
            : message.action === 'update_cases'
              ? t('ASSISTANT.CONFIRM_UPDATE_CASES_BODY')
              : message.action === 'delete_cases'
                ? t('ASSISTANT.CONFIRM_DELETE_CASES_BODY')
                : message.action === 'send_bug'
                  ? t('ASSISTANT.CONFIRM_SEND_BUG_BODY')
                  : message.action === 'delete_workspace'
                    ? t('ASSISTANT.CONFIRM_DELETE_WORKSPACE_BODY')
                    : message.action === 'disconnect_integration'
                      ? t('ASSISTANT.CONFIRM_DISCONNECT_BODY')
                      : message.action === 'delete_variable'
                        ? message.count === 0
                          ? t('ASSISTANT.CONFIRM_DELETE_VARIABLE_BODY_NONE')
                          : message.count === 1
                            ? t('ASSISTANT.CONFIRM_DELETE_VARIABLE_BODY_ONE')
                            : t('ASSISTANT.CONFIRM_DELETE_VARIABLE_BODY_OTHER', {
                                count: message.count,
                              })
                        : message.count === 0
                          ? t('ASSISTANT.CONFIRM_DELETE_PROJECT_BODY_NONE')
                          : message.count === 1
                            ? t('ASSISTANT.CONFIRM_DELETE_PROJECT_BODY_ONE')
                            : t('ASSISTANT.CONFIRM_DELETE_PROJECT_BODY_OTHER', {
                                count: message.count,
                              }),
    hasBody: message.action !== 'rename_workspace',
    fromAgent: message.from === 'outside' ? t('ASSISTANT.FROM_AGENT') : '',
    isFromAgent: message.from === 'outside',
    goLabel: t(texts.go),
    goVariant: texts.variant,
    keepLabel: t('ASSISTANT.KEEP'),
    isOpen,
    className: `confirm-card confirm-card--${message.decision ?? 'open'}`,
    result:
      message.decision === 'confirmed'
        ? t(texts.gone)
        : message.decision === 'kept'
          ? t('ASSISTANT.KEPT')
          : t('ASSISTANT.EXPIRED'),
    icon:
      message.decision === 'confirmed'
        ? ('passed' as const)
        : message.decision === 'kept'
          ? ('replay' as const)
          : ('skipped' as const),
    onGo: () => {
      if (isOpen) settleConfirm({ id: message.id, decision: 'confirmed' });
    },
    onKeep: () => {
      if (isOpen) settleConfirm({ id: message.id, decision: 'kept' });
    },
  };
};
