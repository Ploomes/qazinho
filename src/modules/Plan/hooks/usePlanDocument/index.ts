import type { IWorkspace } from '@/modules/Workspace';
import type { BugReportBlock } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { planDocOf } from '@/modules/Plan/library';
import { DOC_VERDICT_KEYS } from '@/modules/Plan/screens/Plan/constants';
import { useSettingsStore } from '@/store';

export const usePlanDocument = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);

  return {
    titleOf: (workspaceName: string) =>
      t('PLAN.PUBLISH_TITLE', { workspace: workspaceName }),
    documentOf: (
      workspace: Pick<
        IWorkspace,
        'plan' | 'runs' | 'issue' | 'sourcePage' | 'design' | 'strategy' | 'doubts'
      >,
    ): BugReportBlock[] => {
      const run = workspace.runs.find(({ kind }) => kind !== 'explore') ?? null;
      const { issue, sourcePage } = workspace;

      return planDocOf({
        plan: workspace.plan,
        strategy: workspace.strategy ?? null,
        doubts: workspace.doubts ?? [],
        run,
        when:
          run === null
            ? ''
            : new Intl.DateTimeFormat(language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(run.startedAt)),
        story:
          issue === null || issue.source !== 'jira'
            ? null
            : { key: issue.key, url: issue.url },
        page:
          sourcePage === null ? null : { title: sourcePage.title, url: sourcePage.url },
        design: workspace.design,
        words: {
          intro: ({ cases, steps }) =>
            t('PLAN_DOC.INTRO', {
              cases:
                cases === 1
                  ? t('PLAN.CASES_ONE')
                  : t('PLAN.CASES_OTHER', { count: cases }),
              steps:
                steps === 1
                  ? t('PLAN.STEPS_ONE')
                  : t('PLAN.STEPS_OTHER', { count: steps }),
            }),
          story: t('PLAN_DOC.STORY'),
          page: t('PLAN_DOC.PAGE'),
          design: t('PLAN_DOC.DESIGN'),
          lastRun: t('PLAN_DOC.LAST_RUN'),
          runLine: (line) => t('PLAN_DOC.RUN_LINE', line),
          priority: t('PLAN_DOC.PRIORITY'),
          goal: t('PLAN_DOC.GOAL'),
          preconditions: t('PLAN_DOC.PRECONDITIONS'),
          action: t('PLAN_DOC.ACTION'),
          expected: t('PLAN_DOC.EXPECTED'),
          frame: t('PLAN_DOC.FRAME'),
          result: t('PLAN_DOC.RESULT'),
          strategy: t('PLAN_DOC.STRATEGY'),
          strategyParts: {
            covers: t('PLAN_DOC.COVERS'),
            leavesOut: t('PLAN_DOC.LEAVES_OUT'),
            where: t('PLAN_DOC.WHERE'),
            data: t('PLAN_DOC.DATA'),
            risks: t('PLAN_DOC.RISKS'),
          },
          doubts: t('PLAN_DOC.DOUBTS'),
          doubt: t('PLAN_DOC.DOUBT'),
          answer: t('PLAN_DOC.ANSWER'),
          doubtWaiting: t('PLAN_DOC.DOUBT_WAITING'),
          doubtNotSent: t('PLAN_DOC.DOUBT_NOT_SENT'),
          sources: t('PLAN_DOC.SOURCES'),
          waitsOn: t('PLAN_DOC.WAITS_ON'),
          verdicts: {
            pending: t(DOC_VERDICT_KEYS.pending),
            running: t(DOC_VERDICT_KEYS.running),
            passed: t(DOC_VERDICT_KEYS.passed),
            failed: t(DOC_VERDICT_KEYS.failed),
            blocked: t(DOC_VERDICT_KEYS.blocked),
            skipped: t(DOC_VERDICT_KEYS.skipped),
          },
          keptBy: t('PLAN_DOC.KEPT_BY'),
        },
      });
    },
  };
};
