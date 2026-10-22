import type { IBugFilingPopupProps } from '@/modules/Bug/screens/Bugs/components/BugFilingPopup/types';
import type {
  IStepsAction,
  IStepsRow,
  StepsTone,
} from '@/shared/components/organisms/StepsPopup/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FILING_FAILURE_KEYS } from '@/modules/Bug/constants';
import { pasteShotOf } from '@/modules/Bug/library';
import { FILING_ROW_STATES } from '@/modules/Bug/screens/Bugs/components/BugFilingPopup/constants';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import { Bugs } from '@/services';
import { useAppStore, useSettingsStore } from '@/store';

export const useBugFilingPopupViewModel = (props: IBugFilingPopupProps) => {
  const { filing, bug, onClose, onRetry } = props;
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const openSettings = useAppStore((state) => state.openSettings);
  const selectTab = useSettingsStore((state) => state.selectTab);
  const { target, result } = filing;
  const tracker = INTEGRATIONS.find(({ id }) => id === target.tracker);
  const name = tracker?.name ?? '';
  const where =
    target.tracker === 'jira' ? target.project : `${target.owner}/${target.name}`;
  const filed = result?.isFiled === true ? result : null;
  const failed = result?.isFiled === false ? result : null;
  const tone: StepsTone =
    filed !== null ? 'connected' : failed !== null ? 'failed' : 'working';
  const isGithub = target.tracker === 'github';
  const screen = pasteShotOf(bug);
  const isUnlinked = filed !== null && filing.story !== null && filed.linked === null;
  const notes = [
    ...(filed !== null && isGithub && screen !== null ? [t('FILING.GITHUB_PASTE')] : []),
    ...(filed !== null && filed.missed.length > 0
      ? [t('FILING.MISSED', { tracker: name, files: filed.missed.join(', ') })]
      : []),
    ...(isUnlinked ? [t('FILING.UNLINKED', { tracker: name, key: filing.story })] : []),
  ];
  const isAccess =
    failed?.failure === 'not-connected' || failed?.failure === 'unauthorized';
  const open = () => {
    if (filed !== null) window.open(filed.issue.url, '_blank', 'noreferrer');
  };
  const actions: IStepsAction[] =
    filed !== null
      ? [
          { key: 'done', label: t('COMMON.DONE'), variant: 'ghost', onClick: onClose },
          ...(isGithub && screen !== null
            ? [
                {
                  key: 'copy',
                  label: isCopied ? t('FILING.COPIED') : t('FILING.COPY_SCREEN'),
                  variant: 'secondary' as const,
                  onClick: () => {
                    void Bugs.copyShot({ file: screen.file, src: screen.src }).then(
                      setIsCopied,
                    );
                  },
                },
              ]
            : []),
          {
            key: 'open',
            label: t('FILING.OPEN_ISSUE', { key: filed.issue.key }),
            variant: 'primary',
            onClick: open,
          },
        ]
      : failed !== null
        ? [
            {
              key: 'close',
              label: t('COMMON.CLOSE'),
              variant: 'ghost',
              onClick: onClose,
            },
            isAccess
              ? {
                  key: 'integrations',
                  label: t('FILING.OPEN_INTEGRATIONS'),
                  variant: 'primary',
                  onClick: () => {
                    selectTab('integrations');
                    openSettings();
                    onClose();
                  },
                }
              : {
                  key: 'retry',
                  label: t('COMMON.TRY_AGAIN'),
                  variant: 'primary',
                  onClick: onRetry,
                },
          ]
        : [];

  return {
    logo: tracker?.logo ?? '',
    name,
    tone,
    title:
      filed !== null
        ? t('FILING.FILED', { key: filed.issue.key })
        : failed !== null
          ? t('FILING.FAILED', { id: bug.id })
          : t('FILING.SENDING', { id: bug.id, tracker: name }),
    subtitle:
      filed !== null
        ? t('FILING.FILED_SUBTITLE', { where })
        : failed !== null
          ? t(FILING_FAILURE_KEYS[failed.failure], { tracker: name, where })
          : t('FILING.SENDING_SUBTITLE'),
    rows: filing.steps.map(({ row, state }): IStepsRow => ({
      key: row,
      label:
        row === 'ready'
          ? t('FILING.STEP_READY')
          : row === 'issue'
            ? t('FILING.STEP_ISSUE', { where })
            : row === 'screens'
              ? filing.shots === 1
                ? t('FILING.STEP_SCREENS_ONE')
                : t('FILING.STEP_SCREENS_OTHER', { count: filing.shots })
              : row === 'video'
                ? t('FILING.STEP_VIDEO')
                : t('FILING.STEP_LINK', { key: filing.story ?? '' }),
      state: FILING_ROW_STATES[state],
    })),
    hint: notes.length === 0 ? null : notes.join(' '),
    page: null,
    detail:
      failed !== null && failed.said !== ''
        ? { text: failed.said, isCommand: false }
        : null,
    code: null,
    shownCode: null,
    actions,
    isKept: filed !== null && notes.length > 0,
    onCancel: onClose,
    onClose,
  };
};
