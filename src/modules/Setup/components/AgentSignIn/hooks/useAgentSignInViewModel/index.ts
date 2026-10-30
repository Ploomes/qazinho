import type { IAgentSignInProps } from '@/modules/Setup/components/AgentSignIn/types';
import type {
  IStepsAction,
  StepRowState,
  StepsTone,
} from '@/shared/components/organisms/StepsPopup/types';
import { useTranslation } from 'react-i18next';
import {
  AGENT_SIGN_IN_FAILURES,
  AGENT_SIGN_IN_STEPS,
} from '@/modules/Setup/components/AgentSignIn/constants';
import { useCountdown } from '@/shared/hooks';

export const useAgentSignInViewModel = (props: IAgentSignInProps) => {
  const { progress, onCancel, onClose, onRetry } = props;
  const { t } = useTranslation();
  const names = { agent: props.agent };
  const failure = progress.phase === 'failed' ? progress : null;
  const working = progress.phase === 'working' ? progress : null;
  const seconds = useCountdown(working?.opensAt ?? null);
  const at =
    progress.phase === 'working' || progress.phase === 'failed' ? progress.at : null;
  const reached = at === null ? progress.steps.length : progress.steps.indexOf(at);
  const tone: StepsTone =
    progress.phase === 'connected' ? 'connected' : failure ? 'failed' : 'working';
  const isInTerminal = seconds === null && working?.at === 'browser';
  const actions: IStepsAction[] =
    tone === 'working'
      ? [
          {
            key: 'cancel',
            label: t('COMMON.CANCEL'),
            variant: 'ghost',
            onClick: onCancel,
          },
        ]
      : tone === 'connected'
        ? [{ key: 'done', label: t('COMMON.DONE'), variant: 'primary', onClick: onClose }]
        : [
            {
              key: 'close',
              label: t('COMMON.CLOSE'),
              variant: 'ghost',
              onClick: onClose,
            },
            ...(failure?.failure === 'unsupported'
              ? []
              : [
                  {
                    key: 'retry',
                    label: t('COMMON.TRY_AGAIN'),
                    variant: 'primary' as const,
                    onClick: onRetry,
                  },
                ]),
          ];

  return {
    tone,
    title:
      tone === 'connected'
        ? t('SETUP.LOGIN_DONE', names)
        : tone === 'failed'
          ? t('SETUP.LOGIN_FAILED', names)
          : t('SETUP.LOGIN_TITLE', names),
    subtitle:
      tone === 'connected'
        ? t('SETUP.LOGIN_DONE_SUBTITLE', names)
        : failure
          ? t(AGENT_SIGN_IN_FAILURES[failure.failure], names)
          : t('SETUP.LOGIN_SUBTITLE', names),
    rows: progress.steps.map((step, index) => {
      const state: StepRowState =
        index < reached
          ? 'done'
          : index > reached
            ? 'pending'
            : failure
              ? 'failed'
              : 'active';

      return { key: step, label: t(AGENT_SIGN_IN_STEPS[step], names), state };
    }),
    hint:
      seconds !== null
        ? t('SETUP.LOGIN_SOON', { ...names, seconds })
        : isInTerminal
          ? t('SETUP.LOGIN_HINT', names)
          : null,
    page: null,
    detail:
      failure !== null && failure.said !== ''
        ? { text: failure.said, isCommand: failure.failure === 'terminal' }
        : null,
    shownCode: null,
    actions,
    onCancel,
    onClose,
  };
};
