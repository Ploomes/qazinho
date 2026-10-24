import type { IProSignInProps } from '@/modules/Pro/components/ProSignIn/types';
import type {
  IStepsAction,
  StepRowState,
  StepsTone,
} from '@/shared/components/organisms/StepsPopup/types';
import { useTranslation } from 'react-i18next';
import {
  PRO_SIGN_IN_FAILURES,
  PRO_SIGN_IN_STEPS,
} from '@/modules/Pro/components/ProSignIn/constants';

export const useProSignInViewModel = (props: IProSignInProps) => {
  const { progress, onCancel, onClose, onRetry } = props;
  const { t } = useTranslation();
  const failure = progress.phase === 'failed' ? progress : null;
  const working = progress.phase === 'working' ? progress : null;
  const at = working?.at ?? failure?.at ?? null;
  const reached = at === null ? progress.steps.length : progress.steps.indexOf(at);
  const tone: StepsTone =
    progress.phase === 'connected' ? 'connected' : failure ? 'failed' : 'working';
  const shown =
    working?.at === 'browser' && working.code !== null
      ? { code: working.code, url: working.url }
      : null;
  const canRetry = failure !== null && failure.failure !== 'no-keychain';
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
            ...(canRetry
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
        ? t('PRO.LOGIN_DONE')
        : tone === 'failed'
          ? t('PRO.LOGIN_FAILED')
          : t('PRO.LOGIN_TITLE'),
    subtitle:
      progress.phase === 'connected'
        ? t('PRO.LOGIN_DONE_SUBTITLE', { account: progress.account })
        : failure
          ? t(PRO_SIGN_IN_FAILURES[failure.failure])
          : t('PRO.LOGIN_SUBTITLE'),
    rows: progress.steps.map((step, index) => {
      const state: StepRowState =
        index < reached
          ? 'done'
          : index > reached
            ? 'pending'
            : failure
              ? 'failed'
              : 'active';

      return { key: step, label: t(PRO_SIGN_IN_STEPS[step]), state };
    }),
    hint: shown === null ? null : t('PRO.LOGIN_HINT'),
    page:
      shown === null || shown.url === null
        ? null
        : { url: shown.url, label: t('COMMON.OPEN_PAGE_AGAIN') },
    detail: null,
    code: null,
    shownCode:
      shown === null
        ? null
        : {
            code: shown.code,
            label: t('PRO.LOGIN_CODE'),
            copy: t('PRO.LOGIN_COPY'),
            copied: t('PRO.LOGIN_COPIED'),
          },
    actions,
    onCancel,
    onClose,
  };
};
