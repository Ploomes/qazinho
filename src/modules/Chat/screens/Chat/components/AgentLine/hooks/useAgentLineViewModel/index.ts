import { useTranslation } from 'react-i18next';
import { AGENT_LINE } from '@/modules/Chat/screens/Chat/components/AgentLine/constants';
import { formatResetsAt } from '@/modules/Chat/screens/Chat/components/AgentLine/library';
import { useModelInUse } from '@/modules/Settings';
import { gaugeTone } from '@/shared/components/atoms/Gauge/library';
import { useAppStore, useMachineStore } from '@/store';

export const useAgentLineViewModel = () => {
  const { t, i18n } = useTranslation();
  const modelMenuAt = useAppStore((state) => state.modelMenuAt);
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const usage = useMachineStore((state) => state.usage);
  const { agent, modelName } = useModelInUse();

  const sessionUsed = usage?.fiveHourUsed ?? null;
  const sessionPercent = Math.round((sessionUsed ?? 0) * 100);
  const weekUsed = usage?.sevenDayUsed ?? null;
  const resets = formatResetsAt({
    resetsAt: usage?.resetsAt ?? 0,
    language: i18n.language,
  });

  return {
    agentLabel: t('USAGE.AGENT', { agent, model: modelName }),
    modelLabel: modelName === '' ? agent : modelName,
    isModelMenuOpen: modelMenuAt === 'composer',
    isSessionShown: sessionUsed !== null && sessionUsed >= AGENT_LINE.sessionShownFrom,
    sessionLabel: t('USAGE.SESSION_SHORT', { percent: sessionPercent }),
    sessionTip: {
      title: t('USAGE.TIP_TITLE', { agent }),
      rows: [
        {
          id: 'session',
          label: t('USAGE.TIP_SESSION'),
          value: t('USAGE.TIP_USED', { percent: sessionPercent }),
          detail: resets === '' ? null : t('USAGE.TIP_RESETS', { resets }),
          fillWidth: `${String(sessionPercent)}%`,
          fillClassName: `session-tip__fill session-tip__fill--${gaugeTone(1 - (sessionUsed ?? 0))}`,
        },
        ...(weekUsed === null
          ? []
          : [
              {
                id: 'week',
                label: t('USAGE.TIP_WEEK'),
                value: t('USAGE.TIP_USED', { percent: Math.round(weekUsed * 100) }),
                detail: null,
                fillWidth: `${String(Math.round(weekUsed * 100))}%`,
                fillClassName: `session-tip__fill session-tip__fill--${gaugeTone(1 - weekUsed)}`,
              },
            ]),
      ],
      note: t('USAGE.TIP_NOTE', { agent }),
    },
    onToggleModelMenu: () => {
      toggleModelMenu('composer');
    },
  };
};
