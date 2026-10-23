import type { IBugCardProps } from '@/modules/Bug/screens/Bugs/components/BugCard/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEVERITY_KEYS } from '@/modules/Bug/constants';
import { pasteShotOf } from '@/modules/Bug/library';
import { BUG_CARD } from '@/modules/Bug/screens/Bugs/components/BugCard/constants';
import { frameUrlOf } from '@/modules/Plan/library';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import { Bugs } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useBugCardViewModel = (props: IBugCardProps) => {
  const { bug, onToggle } = props;
  const { t } = useTranslation();
  const openMedia = useAppStore((state) => state.openMedia);
  const design = useWorkspaceStore(
    (state) =>
      state.workspaces.find(({ id }) => id === props.workspaceId)?.design ?? null,
  );
  const frameUrl =
    design === null || bug.frame === null
      ? null
      : frameUrlOf({ design, frame: bug.frame });
  const [isCopied, setIsCopied] = useState(false);
  const { filed } = bug;
  const screen = filed?.tracker === 'github' ? pasteShotOf(bug) : null;

  const step = t('BUG.STEP', { number: bug.stepNumber });
  const last = bug.sightings.at(-1) ?? null;
  const shots = [
    ...bug.shots.map((shot) => ({
      ...shot,
      label: t(shot.isBad ? 'BUG.SHOT_BROKE' : 'BUG.SHOT_BEFORE'),
    })),
    ...bug.sightings.map((sighting) => ({
      ...sighting.shot,
      label: t('BUG.SHOT_AGAIN', { run: sighting.runId }),
    })),
  ];

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
      ...(last === null
        ? []
        : [
            {
              key: 'last',
              label: t('BUG.META_LAST'),
              value: `${last.runId} · ${last.runWhen}`,
            },
          ]),
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
    hasCase: props.hasCase,
    newLabel: bug.sightings.length > 0 ? t('BUG.SEEN_AGAIN') : t('BUG.JUST_CAUGHT'),
    runLabel: t('BUG.GO_TO_RUN', { id: props.lastRunId }),
    caseLabel: t('BUG.GO_TO_CASE', { id: bug.caseId }),
    onHeadClick: () => {
      onToggle(bug.id);
    },
    onRunClick: () => {
      props.onOpenRun(props.lastRunId);
    },
    onCaseClick: () => {
      props.onOpenCase(bug.caseId);
    },
    filedKey: filed?.key ?? null,
    updateChip:
      bug.review?.state !== 'suggested'
        ? null
        : bug.review.verdict === 'regression'
          ? {
              label: t('BUG_UPDATE.CHIP_REGRESSION'),
              className: 'bug-card__update bug-card__update--regression',
            }
          : { label: t('BUG_UPDATE.CHIP_UPDATE'), className: 'bug-card__update' },
    sendLabel: t('FILING.SEND'),
    issueLabel:
      filed === null
        ? ''
        : t('FILING.VIEW_ISSUE', {
            tracker: INTEGRATIONS.find(({ id }) => id === filed.tracker)?.name ?? '',
          }),
    canCopyScreen: screen !== null,
    copyLabel: isCopied ? t('FILING.COPIED') : t('FILING.COPY_SCREEN'),
    onSendClick: () => {
      props.onSend(bug.id);
    },
    isTrackerShown: !bug.isDismissed,
    dismissLabel: t(bug.isDismissed ? 'BUG.REOPEN' : 'BUG.DISMISS'),
    onDismissClick: () => {
      props.onDismiss({ bugId: bug.id, isDismissed: !bug.isDismissed });
    },
    offDesign: bug.frame === null ? null : t('BUG.OFF_DESIGN'),
    frameLabel: frameUrl === null ? null : t('BUG.SEE_FRAME'),
    onFrameClick: () => {
      if (frameUrl !== null) window.open(frameUrl, '_blank', 'noreferrer');
    },
    onIssueClick: () => {
      if (filed !== null) window.open(filed.url, '_blank', 'noreferrer');
    },
    onCopyScreen: () => {
      if (screen !== null)
        void Bugs.copyShot({ file: screen.file, src: screen.src }).then(setIsCopied);
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
