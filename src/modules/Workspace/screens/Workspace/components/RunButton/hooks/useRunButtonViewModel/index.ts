import type { IRunButtonProps } from '@/modules/Workspace/screens/Workspace/components/RunButton/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RUN_BUTTON } from '@/modules/Workspace/screens/Workspace/components/RunButton/constants';
import { MOTION } from '@/shared/constants';
import { useDismiss } from '@/shared/hooks';
import { useSettingsStore } from '@/store';

export const useRunButtonViewModel = (props: IRunButtonProps) => {
  const {
    canRun,
    canChoose,
    developed,
    toDevelop,
    onRun,
    onRunDeveloped,
    onRunWithAgent,
  } = props;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const runCombo = useSettingsStore(
    (state) => state.keybinds.find(({ id }) => id === 'run')?.combo ?? null,
  );
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });
  const isMenuOpen = isOpen && canRun && canChoose;
  const isDeveloping = toDevelop > 0;
  const planTitle = !isDeveloping
    ? t('WORKSPACE.RUN_PLAN')
    : developed === 0
      ? t('WORKSPACE.DEVELOP_PLAN')
      : t(toDevelop === 1 ? 'WORKSPACE.DEVELOP_ONE' : 'WORKSPACE.DEVELOP_OTHER', {
          count: toDevelop,
        });
  const planHint = t(
    isDeveloping ? 'WORKSPACE.DEVELOP_PLAN_HINT' : 'WORKSPACE.RUN_PLAN_HINT',
  );

  return {
    ref,
    className: [
      'run-button',
      ...(canRun ? [] : ['run-button--disabled']),
      ...(isMenuOpen ? ['run-button--open'] : []),
    ].join(' '),
    style: { '--run-menu-width': `${String(RUN_BUTTON.menuWidthPx)}px` } as CSSProperties,
    runLabel: planTitle,
    isDisabled: !canRun,
    tip: canRun ? planHint : t('WORKSPACE.RUN_NO_STEPS'),
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
        icon: isDeveloping ? ('sparkle' as const) : ('play' as const),
        title: planTitle,
        hint: planHint,
        combo: runCombo,
        onPick: () => {
          setOpen(false);
          onRun();
        },
      },
      ...(isDeveloping && developed > 0
        ? [
            {
              key: 'developed',
              icon: 'play' as const,
              title: t(
                developed === 1
                  ? 'WORKSPACE.RUN_DEVELOPED_ONE'
                  : 'WORKSPACE.RUN_DEVELOPED_OTHER',
                { count: developed },
              ),
              hint: t('WORKSPACE.RUN_DEVELOPED_HINT'),
              combo: null,
              onPick: () => {
                setOpen(false);
                onRunDeveloped();
              },
            },
          ]
        : []),
      {
        key: 'agent',
        icon: 'sparkle' as const,
        title: t('WORKSPACE.REDEVELOP'),
        hint: t('WORKSPACE.REDEVELOP_HINT'),
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
