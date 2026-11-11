import type { IBugPageProps } from '@/modules/Bug/screens/Bugs/components/BugPage/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pasteShotOf } from '@/modules/Bug/library';
import { BUG_PAGE } from '@/modules/Bug/screens/Bugs/components/BugPage/constants';
import { frameUrlOf } from '@/modules/Plan/library';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import { Bugs } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useBugPageViewModel = (props: IBugPageProps) => {
  const { bug } = props;
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
  const [isAllSteps, setIsAllSteps] = useState(false);
  const { filed } = bug;
  const screen = filed?.tracker === 'github' ? pasteShotOf(bug) : null;

  const step = t('BUG.STEP', { number: bug.stepNumber });
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

  const hero = shots.find(({ isBad }) => isBad) ?? shots[0] ?? null;
  const broke = bug.repro.findIndex(({ isBad }) => isBad);
  const numbered = bug.repro.map((repro, index) => ({ ...repro, number: index + 1 }));
  const first = numbered.slice(0, Math.max(BUG_PAGE.stepsShown, broke + 1));
  const runWhen =
    bug.sightings.find(({ runId }) => runId === props.lastRunId)?.runWhen ?? bug.runWhen;

  return {
    style: { '--bug-page-width': `${String(BUG_PAGE.widthPx)}px` } as CSSProperties,
    backLabel: t('BUG.BACK'),
    metaKey:
      bug.seenRuns > 1
        ? ('BUG.PAGE_META_OTHER' as const)
        : ('BUG.PAGE_META_ONE' as const),
    metaValues: {
      count: bug.seenRuns,
      when: runWhen,
      step: bug.stepNumber,
      caseId: bug.caseId,
    },
    caseTitle: bug.caseTitle,
    expectedLabel: t('COMMON.EXPECTED'),
    gotLabel: t('COMMON.GOT'),
    hero,
    design: bug.design === null ? null : { ...bug.design, label: t('BUG.SHOT_DESIGN') },
    realLabel: t('BUG.SHOT_REAL'),
    evidenceClass:
      bug.design === null
        ? 'bug-page__evidence'
        : 'bug-page__evidence bug-page__evidence--compare',
    thumbs: shots.filter((shot) => shot !== hero),
    steps: isAllSteps ? numbered : first,
    stepsToggle:
      first.length === numbered.length
        ? null
        : isAllSteps
          ? t('BUG.FEWER_STEPS')
          : t(numbered.length - first.length === 1 ? 'BUG.MORE_STEP' : 'BUG.MORE_STEPS', {
              count: numbered.length - first.length,
            }),
    onStepsToggle: () => {
      setIsAllSteps(!isAllSteps);
    },
    failedHere: t('BUG.FAILED_HERE'),
    shots,
    moment: props.moment,
    shotsStyle: {
      '--moment-width': `${String(BUG_PAGE.momentWidthPx)}px`,
      '--moment-height': `${String(BUG_PAGE.momentHeightPx)}px`,
    } as CSSProperties,
    hasRun: props.hasRun,
    hasCase: props.hasCase,
    runLabel: t('BUG.GO_TO_RUN', { id: props.lastRunId }),
    caseLabel: t('BUG.GO_TO_CASE', { id: bug.caseId }),
    onBack: props.onBack,
    onRunClick: () => {
      props.onOpenRun(props.lastRunId);
    },
    onCaseClick: () => {
      props.onOpenCase(bug.caseId);
    },
    filedKey: filed?.key ?? null,
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
        kicker: `${bug.id}, ${step}`,
        title: shot.label,
        src: shot.src,
        file: shot.file,
      });
    },
  };
};
