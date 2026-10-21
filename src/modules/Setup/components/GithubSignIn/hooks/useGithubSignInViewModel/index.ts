import type { IGithubSignInProps } from '@/modules/Setup/components/GithubSignIn/types';
import type {
  IStepsAction,
  StepRowState,
  StepsTone,
} from '@/shared/components/organisms/StepsPopup/types';
import { useTranslation } from 'react-i18next';
import {
  GITHUB_SIGN_IN_FAILURES,
  GITHUB_SIGN_IN_STEPS,
} from '@/modules/Setup/components/GithubSignIn/constants';

export const useGithubSignInViewModel = (props: IGithubSignInProps) => {
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
            ...(failure?.failure === 'missing'
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
        ? t('SETUP.GITHUB_LOGIN_DONE')
        : tone === 'failed'
          ? t('SETUP.GITHUB_LOGIN_FAILED')
          : t('SETUP.GITHUB_LOGIN_TITLE'),
    subtitle:
      progress.phase === 'connected'
        ? t('SETUP.GITHUB_LOGIN_DONE_SUBTITLE', { account: progress.account })
        : failure
          ? t(GITHUB_SIGN_IN_FAILURES[failure.failure])
          : t('SETUP.GITHUB_LOGIN_SUBTITLE'),
    rows: progress.steps.map((step, index) => {
      const state: StepRowState =
        index < reached
          ? 'done'
          : index > reached
            ? 'pending'
            : failure
              ? 'failed'
              : 'active';

      return { key: step, label: t(GITHUB_SIGN_IN_STEPS[step]), state };
    }),
    hint: shown === null ? null : t('SETUP.GITHUB_LOGIN_HINT'),
    page:
      shown?.url === null || shown === null
        ? null
        : { url: shown.url, label: t('COMMON.OPEN_PAGE_AGAIN') },
    detail:
      failure !== null && failure.said !== ''
        ? { text: failure.said, isCommand: false }
        : null,
    code: null,
    shownCode:
      shown === null
        ? null
        : {
            code: shown.code,
            label: t('SETUP.GITHUB_LOGIN_CODE'),
            copy: t('SETUP.GITHUB_LOGIN_COPY'),
            copied: t('SETUP.GITHUB_LOGIN_COPIED'),
          },
    actions,
    onCancel,
    onClose,
  };
};
