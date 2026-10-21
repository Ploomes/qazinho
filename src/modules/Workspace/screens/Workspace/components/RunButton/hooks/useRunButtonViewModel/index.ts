import type { IRunButtonProps } from '@/modules/Workspace/screens/Workspace/components/RunButton/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RUN_BUTTON } from '@/modules/Workspace/screens/Workspace/components/RunButton/constants';
import { MOTION } from '@/shared/constants';
import { useDismiss } from '@/shared/hooks';
import { useSettingsStore } from '@/store';

export const useRunButtonViewModel = (props: IRunButtonProps) => {
  const { canRun, canChoose, onRun, onRunWithAgent } = props;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const runCombo = useSettingsStore(
    (state) => state.keybinds.find(({ id }) => id === 'run')?.combo ?? null,
  );
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });
  const isMenuOpen = isOpen && canRun && canChoose;

  return {
    ref,
    className: [
      'run-button',
      ...(canRun ? [] : ['run-button--disabled']),
      ...(isMenuOpen ? ['run-button--open'] : []),
    ].join(' '),
    style: { '--run-menu-width': `${String(RUN_BUTTON.menuWidthPx)}px` } as CSSProperties,
    runLabel: t('WORKSPACE.RUN_PLAN'),
    isDisabled: !canRun,
    hasChoices: canChoose,
    chooseLabel: t('WORKSPACE.RUN_CHOICES'),
    isOpen: isMenuOpen,
    caretClassName: isMenuOpen
      ? 'run-button__caret run-button__caret--open'
      : 'run-button__caret',
    foldTransition: { duration: MOTION.duration, ease: MOTION.ease },
    options: [
      {
        key: 'plan',
        icon: 'play' as const,
        title: t('WORKSPACE.RUN_PLAN'),
        hint: t('WORKSPACE.RUN_PLAN_HINT'),
        combo: runCombo,
        onPick: () => {
          setOpen(false);
          onRun();
        },
      },
      {
        key: 'agent',
        icon: 'sparkle' as const,
        title: t('WORKSPACE.RUN_WITH_AGENT'),
        hint: t('WORKSPACE.RUN_WITH_AGENT_HINT'),
        combo: null,
        onPick: () => {
          setOpen(false);
          onRunWithAgent();
        },
      },
    ],
    onRun: () => {
      if (canRun) onRun();
    },
    onToggle: () => {
      if (canRun && canChoose) setOpen(!isOpen);
    },
  };
};
