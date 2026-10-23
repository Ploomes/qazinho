import type { ITitlebarProps } from '@/shared/components/organisms/Titlebar/types';
import { useTranslation } from 'react-i18next';
import { useModelInUse } from '@/modules/Settings';
import { Platform } from '@/services';
import { gaugeTone } from '@/shared/components/atoms/Gauge/library';
import { formatResetsAt } from '@/shared/components/organisms/Titlebar/library';
import { useAppStore, useMachineStore } from '@/store';

export const useTitlebarViewModel = (props: ITitlebarProps = {}) => {
  const { isBare = false } = props;
  const { t, i18n } = useTranslation();
  const isResourcesOpen = useAppStore((state) => state.isResourcesOpen);
  const modelMenuAt = useAppStore((state) => state.modelMenuAt);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const resources = useMachineStore((state) => state.resources);
  const usage = useMachineStore((state) => state.usage);
  const { agent, modelName } = useModelInUse();

  const cpu = Math.round(resources.cpu);
  const ramGb = resources.ramMb / 1024;
  const processCount = resources.processes.length;

  const sessionUsed = usage?.fiveHourUsed ?? null;
  const sessionPercent = Math.round((sessionUsed ?? 0) * 100);
  const weekUsed = usage?.sevenDayUsed ?? null;

  return {
    isBare,
    className: [
      'titlebar',
      Platform.isMac() ? 'titlebar--mac' : 'titlebar--overlay',
      isBare ? 'titlebar--bare' : '',
    ]
      .filter((part) => part.length > 0)
      .join(' '),
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
    agentLabel: t('TITLEBAR.AGENT', { agent, model: modelName }),
    betaLabel: t('TITLEBAR.BETA'),
    sessionUsed,
    sessionLabel:
      sessionUsed === null
        ? null
        : (usage?.resetsAt ?? 0) > 0
          ? t('TITLEBAR.SESSION_USED', {
              percent: sessionPercent,
              resets: formatResetsAt({
                resetsAt: usage?.resetsAt ?? 0,
                language: i18n.language,
              }),
            })
          : t('TITLEBAR.SESSION_ONLY', { percent: sessionPercent }),
    sessionTip: {
      title: t('TITLEBAR.TIP_TITLE', { agent }),
      rows: [
        {
          id: 'session',
          label: t('TITLEBAR.TIP_SESSION'),
          value: t('TITLEBAR.TIP_USED', { percent: sessionPercent }),
          detail:
            (usage?.resetsAt ?? 0) > 0
              ? t('TITLEBAR.TIP_RESETS', {
                  resets: formatResetsAt({
                    resetsAt: usage?.resetsAt ?? 0,
                    language: i18n.language,
                  }),
                })
              : null,
          fillWidth: `${String(sessionPercent)}%`,
          fillClassName: `session-tip__fill session-tip__fill--${gaugeTone(1 - (sessionUsed ?? 0))}`,
        },
        ...(weekUsed === null
          ? []
          : [
              {
                id: 'week',
                label: t('TITLEBAR.TIP_WEEK'),
                value: t('TITLEBAR.TIP_USED', { percent: Math.round(weekUsed * 100) }),
                detail: null,
                fillWidth: `${String(Math.round(weekUsed * 100))}%`,
                fillClassName: `session-tip__fill session-tip__fill--${gaugeTone(1 - weekUsed)}`,
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
