import type { IBugCardProps } from '@/modules/Bug/screens/Bugs/components/BugCard/types';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { SEVERITY_KEYS } from '@/modules/Bug/constants';
import { BUG_CARD } from '@/modules/Bug/screens/Bugs/components/BugCard/constants';
import { useAppStore } from '@/store';

export const useBugCardViewModel = (props: IBugCardProps) => {
  const { bug, onToggle } = props;
  const { t } = useTranslation();
  const openMedia = useAppStore((state) => state.openMedia);

  const step = t('BUG.STEP', { number: bug.stepNumber });
  const shots = bug.shots.map((shot) => ({
    ...shot,
    label: t(shot.isBad ? 'BUG.SHOT_BROKE' : 'BUG.SHOT_BEFORE'),
  }));

  return {
    hasBody: bug.body.length > 0,
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
      ...(bug.agent === ''
        ? []
        : [
            {
              key: 'agent',
              label: t('BUG.META_AGENT'),
              value: `${bug.agent} · ${bug.modelName ?? t('MODEL.AGENT_DEFAULT')}`,
            },
          ]),
    ],
    shots,
    moment: props.moment,
    shotsStyle: {
      '--moment-width': `${String(BUG_CARD.momentWidthPx)}px`,
      '--moment-height': `${String(BUG_CARD.momentHeightPx)}px`,
    } as CSSProperties,
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
        src: shot.src,
        file: shot.file,
      });
    },
  };
};
