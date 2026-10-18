import type { IBugCardProps } from '@/modules/Bug/screens/Bugs/components/BugCard/types';
import { useTranslation } from 'react-i18next';
import { SEVERITY_KEYS } from '@/modules/Bug/constants';
import { useModelInUse } from '@/modules/Settings';
import { useAppStore } from '@/store';

export const useBugCardViewModel = (props: IBugCardProps) => {
  const { bug, isOpen, onToggle } = props;
  const { t } = useTranslation();
  const { agent, modelName } = useModelInUse();
  const openMedia = useAppStore((state) => state.openMedia);

  const step = t('BUG.STEP', { number: bug.stepNumber });
  const shots = bug.shots.map((shot) => ({
    ...shot,
    label: t(shot.isBad ? 'BUG.SHOT_BROKE' : 'BUG.SHOT_BEFORE'),
  }));

  return {
    caret: isOpen ? '▾' : '▸',
    severity: t(SEVERITY_KEYS[bug.severity]),
    meta: [
      { key: 'run', label: t('BUG.META_RUN'), value: `${bug.runId} · ${bug.runWhen}` },
      { key: 'case', label: t('BUG.META_CASE'), value: `${bug.caseId} · ${step}` },
      { key: 'target', label: t('BUG.META_TARGET'), value: bug.target },
      {
        key: 'seen',
        label: t('BUG.META_SEEN'),
        value:
          bug.seenRuns > 1
            ? t('BUG.SEEN_RUNS', { count: bug.seenRuns })
            : t('BUG.SEEN_ONCE'),
      },
      { key: 'agent', label: t('BUG.META_AGENT'), value: `${agent} · ${modelName}` },
    ],
    shots,
    hasRun: props.hasRun,
    onHeadClick: () => {
      onToggle(bug.id);
    },
    onOpenRunClick: () => {
      props.onOpenRun(bug.runId);
    },
    onOpenShot: (shot: (typeof shots)[number]) => {
      openMedia({
        kicker: `${bug.id} · ${step}`,
        title: shot.label,
        isTall: false,
        src: shot.src,
        file: shot.file,
      });
    },
  };
};
