import type { ISuiteFieldProps } from '@/modules/Project/components/ProjectModal/components/SuiteField/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Suites } from '@/services';
import { useSuiteStore } from '@/store';

export const useSuiteFieldViewModel = (props: ISuiteFieldProps) => {
  const { projectId, variableNames } = props;
  const { t } = useTranslation();
  const suite = useSuiteStore((state) =>
    projectId === null ? null : (state.suites[projectId] ?? null),
  );
  const putSuite = useSuiteStore((state) => state.putSuite);
  const [picking, setPicking] = useState<'idle' | 'picking' | 'refused'>('idle');

  return {
    canConnect: projectId !== null,
    isConnected: suite !== null,
    isPicking: picking === 'picking',
    hasRefused: picking === 'refused',
    connectLabel: t('AUTOMATION.CONNECT'),
    laterText: t('AUTOMATION.CONNECT_LATER'),
    refusedText: t('AUTOMATION.NO_PLAYWRIGHT'),
    name: suite?.name ?? '',
    path: suite?.path ?? '',
    hasPackages: suite?.version !== null && suite !== null,
    runner:
      suite?.version === null || suite === null
        ? t('AUTOMATION.NO_PACKAGES')
        : t('AUTOMATION.PLAYWRIGHT', { version: suite.version }),
    packagesText: t('AUTOMATION.NO_PACKAGES_TEXT'),
    branch: suite?.branch ?? null,
    repository: suite?.repository ?? null,
    hasSettings: (suite?.envKeys.length ?? 0) > 0,
    settingsTitle: t('AUTOMATION.SETTINGS'),
    settingsNote: t('AUTOMATION.SETTINGS_NOTE'),
    settings: (suite?.envKeys ?? []).map((key) => {
      const source = variableNames.includes(key)
        ? ('variable' as const)
        : suite?.envFileKeys.includes(key) === true
          ? ('env' as const)
          : ('missing' as const);

      return {
        key,
        className: `suite-field__setting suite-field__setting--${source}`,
        icon:
          source === 'variable'
            ? ('lock' as const)
            : source === 'env'
              ? ('file' as const)
              : ('attention' as const),
        word:
          source === 'variable'
            ? t('AUTOMATION.SETTING_VARIABLE')
            : source === 'env'
              ? t('AUTOMATION.SETTING_ENV')
              : t('AUTOMATION.SETTING_MISSING'),
      };
    }),
    changeLabel: t('AUTOMATION.CHANGE'),
    forgetLabel: t('AUTOMATION.DISCONNECT'),
    onPick: () => {
      if (projectId === null || picking === 'picking') return;

      setPicking('picking');
      void Suites.pick(projectId).then((picked) => {
        if (picked.kind === 'picked') putSuite({ projectId, suite: picked.suite });

        setPicking(picked.kind === 'failed' ? 'refused' : 'idle');
      });
    },
    onForget: () => {
      if (projectId === null) return;

      void Suites.forget(projectId);
      putSuite({ projectId, suite: null });
      setPicking('idle');
    },
  };
};
