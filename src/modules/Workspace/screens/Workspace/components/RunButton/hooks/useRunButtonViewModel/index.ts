import type { IRunButtonProps } from '@/modules/Workspace/screens/Workspace/components/RunButton/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RUN_BUTTON } from '@/modules/Workspace/screens/Workspace/components/RunButton/constants';
import { EXPLORATION, MOTION } from '@/shared/constants';
import { useDismiss } from '@/shared/hooks';
import { useSettingsStore } from '@/store';

export const useRunButtonViewModel = (props: IRunButtonProps) => {
  const {
    canRun,
    canChoose,
    developed,
    toDevelop,
    toContinue,
    onRun,
    onRunPlan,
    onRunDeveloped,
    onRunWithAgent,
  } = props;
  const canExplore = props.canExplore === true;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const runCombo = useSettingsStore(
    (state) => state.keybinds.find(({ id }) => id === 'run')?.combo ?? null,
  );
  const ref = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });
  const isMenuOpen = isOpen && canRun && (canChoose || canExplore);
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
  const isContinuing = toContinue > 0;
  const continueHint = t(
    toContinue === 1 ? 'WORKSPACE.CONTINUE_HINT_ONE' : 'WORKSPACE.CONTINUE_HINT_OTHER',
    { count: toContinue },
  );

  return {
    ref,
    className: [
      'run-button',
      ...(canRun ? [] : ['run-button--disabled']),
      ...(isMenuOpen ? ['run-button--open'] : []),
    ].join(' '),
    style: { '--run-menu-width': `${String(RUN_BUTTON.menuWidthPx)}px` } as CSSProperties,
    runLabel: isContinuing ? t('WORKSPACE.CONTINUE_RUN') : planTitle,
    isDisabled: !canRun,
    tip: !canRun ? t('WORKSPACE.RUN_NO_STEPS') : isContinuing ? continueHint : planHint,
    hasChoices: canChoose || canExplore,
    foldClassName: canChoose
      ? 'run-button__fold'
      : 'run-button__fold run-button__fold--narrow',
    chooseLabel: t('WORKSPACE.RUN_CHOICES'),
    isOpen: isMenuOpen,
    caretClassName: isMenuOpen
      ? 'run-button__caret run-button__caret--open'
      : 'run-button__caret',
    foldTransition: { duration: MOTION.duration, ease: MOTION.ease },
    options: [
      ...(isContinuing
        ? [
            {
              key: 'continue',
              className: 'run-button__option',
              icon: 'play' as const,
              title: t('WORKSPACE.CONTINUE_RUN'),
              hint: continueHint,
              combo: runCombo,
              onPick: () => {
                setOpen(false);
                onRun();
              },
            },
          ]
        : []),
      {
        key: 'plan',
        className: 'run-button__option',
        icon: isDeveloping ? ('sparkle' as const) : ('play' as const),
        title: planTitle,
        hint: planHint,
        combo: isContinuing ? null : runCombo,
        onPick: () => {
          setOpen(false);
          onRunPlan();
        },
      },
      ...(isDeveloping && developed > 0
        ? [
            {
              key: 'developed',
              className: 'run-button__option',
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
      ...(developed > 0
        ? [
            {
              key: 'agent',
              className: 'run-button__option',
              icon: 'sparkle' as const,
              title: t('WORKSPACE.REDEVELOP'),
              hint: t('WORKSPACE.REDEVELOP_HINT'),
              combo: null,
              onPick: () => {
                setOpen(false);
                onRunWithAgent();
              },
            },
          ]
        : []),
      ...(canExplore
        ? [
            {
              key: 'explore',
              className: 'run-button__option run-button__option--explore',
              icon: 'search' as const,
              title: t('WORKSPACE.EXPLORE'),
              hint: t('WORKSPACE.EXPLORE_HINT', { minutes: EXPLORATION.minutes }),
              combo: null,
              onPick: () => {
                setOpen(false);
                props.onExplore?.();
              },
            },
          ]
        : []),
    ],
    onRun: () => {
      if (canRun) onRun();
    },
    onToggle: () => {
      if (canRun && (canChoose || canExplore)) setOpen(!isOpen);
    },
  };
};
