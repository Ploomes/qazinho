import { useTranslation } from 'react-i18next';
import { RUN_STAGE_TITLES } from '@/modules/Chat/screens/Chat/components/RunProgress/constants';
import { formatElapsed } from '@/modules/Device/library';
import { liveCasesOf } from '@/modules/Plan/library';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';

export const useRunProgressViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    plan: opened.plan,
    live: opened.live,
  }));
  const live = workspace?.live ?? null;
  const plan = workspace?.plan ?? [];
  const cases = liveCasesOf({ plan, live });
  const walked = plan.filter(({ id }) => cases[id] !== undefined);
  const isNow = (id: string) => {
    const status = cases[id]?.status;

    return status === 'running' || status === 'paused' || status === 'attention';
  };
  const nowIndex = walked.findIndex(({ id }) => isNow(id));
  const count = walked.length;
  const how = live?.how ?? 'replay';
  const time = formatElapsed(live?.elapsedSec ?? 0);
  const current = Math.max(1, nowIndex + 1);
  const isExploring = live?.kind === 'explore';
  const screens = live?.outcomes.length ?? 0;

  return {
    title: isExploring
      ? t('RUN_STAGE.TITLE_EXPLORE')
      : t(RUN_STAGE_TITLES[how][count === 1 ? 'one' : 'other'], { count }),
    sub: isExploring
      ? t(screens === 1 ? 'RUN_STAGE.SUB_EXPLORE_ONE' : 'RUN_STAGE.SUB_EXPLORE_OTHER', {
          count: screens,
          time,
        })
      : live?.question !== undefined
        ? t('RUN_STAGE.SUB_ASKED', { current, total: count })
        : live?.isRunning === false
          ? t('RUN_STAGE.SUB_PAUSED', { current, total: count })
          : t('RUN_STAGE.SUB', { current, total: count, time }),
    cases: walked.map((testCase, index) => {
      const shown = cases[testCase.id]?.run?.steps ?? [];
      const isOpen = index === nowIndex;
      const status = cases[testCase.id]?.status ?? 'pending';

      return {
        id: testCase.id,
        title: testCase.title,
        className: isOpen
          ? 'run-progress__case run-progress__case--now'
          : status === 'pending'
            ? 'run-progress__case run-progress__case--waiting'
            : 'run-progress__case',
        mark:
          status === 'failed' || status === 'blocked'
            ? ('failed' as const)
            : status === 'passed'
              ? ('check' as const)
              : null,
        markClassName:
          status === 'failed' || status === 'blocked'
            ? 'run-progress__mark run-progress__mark--failed'
            : 'run-progress__mark',
        steps: !isOpen
          ? []
          : testCase.steps.map((step, stepIndex) => {
              const walkedStep = shown[stepIndex];
              const verdict = walkedStep?.verdict ?? 'pending';

              return {
                key: `${testCase.id}-${String(stepIndex)}`,
                action: walkedStep?.action ?? step.action,
                className: `run-progress__step run-progress__step--${verdict}`,
                icon:
                  verdict === 'running'
                    ? ('running' as const)
                    : verdict === 'passed'
                      ? ('check' as const)
                      : verdict === 'pending'
                        ? null
                        : ('failed' as const),
              };
            }),
      };
    }),
  };
};
