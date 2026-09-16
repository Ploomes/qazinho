import { useTranslation } from 'react-i18next';
import { formatResetsAt } from '@/components/organisms/Titlebar/library';
import { Platform } from '@/services';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

export const useTitlebarViewModel = () => {
  const { t } = useTranslation();
  const isResourcesOpen = useAppStore((state) => state.isResourcesOpen);
  const modelMenuAt = useAppStore((state) => state.modelMenuAt);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const resources = useMachineStore((state) => state.resources);
  const usage = useMachineStore((state) => state.usage);
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);

  const cpu = Math.round(resources.cpu);
  const ramGb = resources.ramMb / 1024;
  const processCount = resources.processes.length;
  const contextLeft =
    usage === null || usage.contextWindow === 0
      ? null
      : 100 - Math.round((usage.contextTokens / usage.contextWindow) * 100);

  const sessionLeft = usage?.fiveHourUsed == null ? null : 1 - usage.fiveHourUsed;
  const sessionPercent = Math.round((sessionLeft ?? 0) * 100);
  const weekPercent =
    usage?.sevenDayUsed == null ? null : 100 - Math.round(usage.sevenDayUsed * 100);

  return {
    isMac: Platform.isMac(),
    isResourcesOpen,
    isModelMenuOpen: modelMenuAt === 'titlebar',
    cpuLabel: t('TITLEBAR.CPU', { percent: cpu }),
    cpuShare: cpu / 100,
    ramLabel: t('TITLEBAR.RAM', {
      used: ramGb.toFixed(1),
      ceiling: resources.ramCeilingGb,
    }),
    processLabel:
      processCount === 1
        ? t('TITLEBAR.PROCESSES_ONE')
        : t('TITLEBAR.PROCESSES_OTHER', { count: processCount }),
    agentLabel:
      contextLeft === null
        ? t('TITLEBAR.AGENT', { agent, model })
        : t('TITLEBAR.CONTEXT_LEFT', { agent, model, percent: contextLeft }),
    sessionLeft,
    sessionLabel:
      sessionLeft === null
        ? null
        : t('TITLEBAR.SESSION_LEFT', {
            percent: Math.round(sessionLeft * 100),
            resets: formatResetsAt(usage?.resetsAt ?? 0),
          }),
    sessionTip: {
      title: t('TITLEBAR.TIP_TITLE', { agent }),
      rows: [
        {
          id: 'session',
          label: t('TITLEBAR.TIP_SESSION'),
          value: t('TITLEBAR.TIP_LEFT', { percent: sessionPercent }),
          detail:
            (usage?.resetsAt ?? 0) > 0
              ? t('TITLEBAR.TIP_RESETS', { resets: formatResetsAt(usage?.resetsAt ?? 0) })
              : null,
          fillWidth: `${String(sessionPercent)}%`,
        },
        ...(weekPercent === null
          ? []
          : [
              {
                id: 'week',
                label: t('TITLEBAR.TIP_WEEK'),
                value: t('TITLEBAR.TIP_LEFT', { percent: weekPercent }),
                detail: null,
                fillWidth: `${String(weekPercent)}%`,
              },
            ]),
      ],
      note: t('TITLEBAR.TIP_NOTE', { agent }),
    },
    onToggleResources: toggleResources,
    onToggleModelMenu: () => {
      toggleModelMenu('titlebar');
    },
  };
};
