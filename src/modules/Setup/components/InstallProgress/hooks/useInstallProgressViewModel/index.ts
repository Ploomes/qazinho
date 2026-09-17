import type { IInstallProgressProps } from '@/modules/Setup/components/InstallProgress/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INSTALL_PROGRESS } from '@/modules/Setup/components/InstallProgress/constants';

export const useInstallProgressViewModel = (props: IInstallProgressProps) => {
  const { state } = props;
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const id = window.setTimeout(() => {
      setIsCopied(false);
    }, INSTALL_PROGRESS.copiedMs);

    return () => {
      window.clearTimeout(id);
    };
  }, [isCopied]);

  return {
    phase: state.phase,
    // One segment per command: the ones that ran are full, the one running shimmers.
    segments:
      state.phase === 'installing'
        ? Array.from({ length: state.stages }, (_, index) => ({
            key: String(index),
            fill:
              index + 1 < state.stage
                ? ('done' as const)
                : index + 1 === state.stage
                  ? ('current' as const)
                  : ('todo' as const),
          }))
        : [],
    label:
      state.phase === 'installing'
        ? t('SETUP.INSTALL_STEP', { stage: state.stage, stages: state.stages })
        : t('SETUP.INSTALLED'),
    line: state.phase === 'installing' ? state.line : '',
    error: state.phase === 'failed' ? state.error : '',
    command: state.phase === 'failed' ? state.command : '',
    copyLabel: isCopied ? t('SETUP.COPIED') : t('SETUP.COPY'),
    onCopy: async () => {
      if (state.phase !== 'failed') return;

      await navigator.clipboard.writeText(state.command);
      setIsCopied(true);
    },
    onRetry: props.onRetry,
  };
};
