import type { IMcpSignInProps } from '@/modules/Setup/components/McpCard/components/McpSignIn/types';
import type {
  IStepsAction,
  StepRowState,
  StepsTone,
} from '@/shared/components/organisms/StepsPopup/types';
import { useTranslation } from 'react-i18next';
import {
  MCP_SIGN_IN_FAILURES,
  MCP_SIGN_IN_STEPS,
} from '@/modules/Setup/components/McpCard/components/McpSignIn/constants';
import { useCountdown } from '@/shared/hooks';

export const useMcpSignInViewModel = (props: IMcpSignInProps) => {
  const { progress, onCancel, onClose, onRetry, onUseTerminal } = props;
  const { t } = useTranslation();
  const names = { server: props.server.name, agent: props.agent };
  const failure = progress.phase === 'failed' ? progress : null;
  const working = progress.phase === 'working' ? progress : null;
  const seconds = useCountdown(working?.opensAt ?? null);
  const at =
    progress.phase === 'working' || progress.phase === 'failed' ? progress.at : null;
  const reached = at === null ? progress.steps.length : progress.steps.indexOf(at);
  const tone: StepsTone =
    progress.phase === 'connected' ? 'connected' : failure ? 'failed' : 'working';
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
            ...(failure?.canUseTerminal
              ? [
                  {
                    key: 'terminal',
                    label: t('MCP.USE_TERMINAL'),
                    variant: 'secondary' as const,
                    onClick: onUseTerminal,
                  },
                ]
              : []),
            ...(failure !== null &&
            failure.failure !== 'unsupported' &&
            failure.failure !== 'manual'
              ? [
                  {
                    key: 'retry',
                    label: t('COMMON.TRY_AGAIN'),
                    variant: 'primary' as const,
                    onClick: onRetry,
                  },
                ]
              : []),
          ];

  return {
    tone,
    title:
      tone === 'connected'
        ? t('MCP.SIGN_IN_DONE', names)
        : tone === 'failed'
          ? t('MCP.SIGN_IN_FAILED', names)
          : t('MCP.SIGN_IN_TITLE', names),
    subtitle:
      tone === 'connected'
        ? t('MCP.SIGN_IN_DONE_SUBTITLE', names)
        : failure
          ? t(MCP_SIGN_IN_FAILURES[failure.failure], names)
          : t('MCP.SIGN_IN_SUBTITLE', names),
    rows: progress.steps.map((step, index) => {
      const state: StepRowState =
        index < reached
          ? 'done'
          : index > reached
            ? 'pending'
            : failure
              ? 'failed'
              : 'active';

      return { key: step, label: t(MCP_SIGN_IN_STEPS[step], names), state };
    }),
    hint:
      seconds !== null
        ? t('MCP.HINT_SOON', { ...names, seconds })
        : working?.at === 'browser' && working.url !== null
          ? t('MCP.HINT_BROWSER', names)
          : working?.at === 'terminal'
            ? t('MCP.HINT_TERMINAL', names)
            : null,
    page:
      seconds === null && working?.at === 'browser' && working.url !== null
        ? { url: working.url, label: t('COMMON.OPEN_PAGE_AGAIN') }
        : null,
    detail:
      failure !== null && failure.said !== ''
        ? { text: failure.said, isCommand: failure.failure === 'manual' }
        : null,
    shownCode: null,
    actions,
    onCancel,
    onClose,
  };
};
