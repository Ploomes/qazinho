import type { ICaseRemoval } from '@/modules/Plan/screens/Plan/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run';
import type { ExportOutcome, PlanPublished } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { viewportOf } from '@/modules/Device';
import {
  addCase,
  addStep,
  caseIdsUsed,
  editCase,
  editStep,
  missingVariablesOf,
  moveCase,
  planDocOf,
  removeCase,
  removeStep,
} from '@/modules/Plan/library';
import { DOC_VERDICT_KEYS, PLAN_SOURCE } from '@/modules/Plan/screens/Plan/constants';
import { useVariableActions } from '@/modules/Project';
import { flattenPlanSteps, useRunActions } from '@/modules/Run';
import { CONFLUENCE_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Confluence, Run } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import {
  useAppStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    name: opened.name,
    plan: opened.plan,
    planSource: opened.planSource,
    sourcePage: opened.sourcePage,
    published: opened.published,
    issue: opened.issue,
    design: opened.design,
    isLocked: opened.live !== null && !opened.live.isDone,
    latest: opened.runs[0] ?? null,
    runs: opened.runs,
    bugs: opened.bugs,
    projectId: opened.projectId,
    targetId: opened.targetId,
    viewportId: opened.viewportId,
  }));
  const target = useAppStore(
    (state) =>
      state.projects
        .find(({ id }) => id === workspace?.projectId)
        ?.targets.find(({ id }) => id === workspace?.targetId) ?? null,
  );
  const openCaseId = useWorkspaceStore((state) => state.openCaseId);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const agent = useSettingsStore((state) => state.agent);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { onRun, onStop } = useRunActions();
  const [removal, setRemoval] = useState<ICaseRemoval | null>(null);
  const [freshCaseId, setFreshCaseId] = useState<string | null>(null);
  const [exported, setExported] = useState<ExportOutcome | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishing, setPublishing] = useState<{
    workspaceId: string;
    outcome: PlanPublished;
  } | null>(null);
  const isConfluenceOn = useSetupStore((state) =>
    state.integrations.some(({ id, confluence }) => id === 'jira' && confluence === true),
  );
  const setPublished = useWorkspaceStore((state) => state.setPublished);
  const kept = useVariablesStore((state) => state.byProject[workspace?.projectId ?? '']);
  const { askVariables } = useVariableActions();
  const language = useSettingsStore((state) => state.language);

  const workspaceId = workspace?.id ?? null;
  const plan = workspace?.plan ?? [];
  const isLocked = workspace?.isLocked === true;

  const write = (cases: ITestCase[]) => {
    if (workspaceId === null || isLocked) return;

    setPlan({ workspaceId, plan: cases });
  };

  const undoable =
    removal !== null &&
    removal.workspaceId === workspaceId &&
    removal.after === plan &&
    !isLocked
      ? removal
      : null;
  const latest = workspace?.latest ?? null;
  const source = workspace?.planSource ?? null;
  const issue = workspace?.issue ?? null;
  const sourcePage = workspace?.sourcePage ?? null;
  const stepCount = flattenPlanSteps(plan).length;
  const published = workspace?.published ?? null;
  const missing = missingVariablesOf({
    plan,
    kept: (kept ?? []).map(({ name }) => name),
  });
  const shownPublishing =
    publishing !== null && publishing.workspaceId === workspaceId
      ? publishing.outcome
      : null;

  const publish = async (props: {
    pageId: string | null;
    spaceId: string;
    parentId: string | null;
    title: string;
  }) => {
    if (workspaceId === null || isPublishing) return;

    const run = (workspace?.runs ?? []).find(({ kind }) => kind !== 'explore') ?? null;

    setIsPublishing(true);

    const outcome = await Confluence.publish({
      ...props,
      blocks: planDocOf({
        plan,
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
        design: workspace?.design ?? null,
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
      }),
    });

    setIsPublishing(false);
    setPublishing({ workspaceId, outcome });

    if (outcome.isPublished)
      setPublished({
        workspaceId,
        published: {
          page: outcome.page,
          spaceId: props.spaceId,
          parentId: props.parentId,
        },
      });
  };
  const lastRuns: Record<string, IRunCase> = Object.fromEntries(
    (latest?.cases ?? []).map((runCase) => [runCase.id, runCase]),
  );

  return {
    plan,
    lastRuns,
    design: workspace?.design ?? null,
    openCaseId,
    isLocked,
    lockedLabel: t('PLAN.LOCKED', { agent }),
    isEmpty: plan.length === 0,
    source:
      source === null
        ? null
        : source.branch === source.base
          ? t('PLAN.SOURCE_WHOLE', {
              repository: source.repository,
              branch: source.branch,
              commit: source.commit.slice(0, PLAN_SOURCE.shaLength),
            })
          : t('PLAN.SOURCE', {
              repository: source.repository,
              branch: source.branch,
              base: source.base,
              commit: source.commit.slice(0, PLAN_SOURCE.shaLength),
            }),
    story:
      issue === null || issue.source !== 'jira'
        ? null
        : {
            text: t('PLAN.STORY', { key: issue.key, summary: issue.title }),
            url: issue.url,
          },
    page:
      sourcePage === null
        ? null
        : { text: t('PLAN.PAGE', { title: sourcePage.title }), url: sourcePage.url },
    summary: t('PLAN.SUMMARY', {
      cases:
        plan.length === 1
          ? t('PLAN.CASES_ONE')
          : t('PLAN.CASES_OTHER', { count: plan.length }),
      steps:
        stepCount === 1
          ? t('PLAN.STEPS_ONE')
          : t('PLAN.STEPS_OTHER', { count: stepCount }),
    }),
    onToggleCase: toggleCase,
    onReorder: write,
    onRunAll: onRun,
    onStop,
    missingNotice:
      missing.length === 0 || isLocked
        ? null
        : t(missing.length === 1 ? 'PLAN.MISSING_ONE' : 'PLAN.MISSING_OTHER', {
            names: missing.map((name) => `\${${name}}`).join(', '),
          }),
    addMissingLabel: t('PLAN.MISSING_ADD'),
    onAddMissing: () => {
      if (workspace === null) return;

      void askVariables({
        projectId: workspace.projectId,
        drafts: missing.map((name) => ({ name, description: '' })),
        by: 'plan',
      });
    },
    canPublish: isConfluenceOn && plan.length > 0 && !isLocked,
    isPublishing,
    publishLabel: isPublishing
      ? t('PLAN.PUBLISHING')
      : published === null
        ? t('PLAN.PUBLISH')
        : t('PLAN.PUBLISH_AGAIN'),
    publishTip: published === null ? t('PLAN.PUBLISH_TIP') : t('PLAN.PUBLISH_AGAIN_TIP'),
    publishedOn:
      published === null
        ? null
        : {
            text: t('PLAN.PUBLISHED_ON', { title: published.page.title }),
            url: published.page.url,
          },
    publishNotice:
      shownPublishing === null
        ? null
        : shownPublishing.isPublished
          ? {
              text: t('PLAN.PUBLISHED', { title: shownPublishing.page.title }),
              isFailed: false,
            }
          : {
              text: t('PLAN.PUBLISH_FAILED', {
                reason: [
                  t(CONFLUENCE_FAILURE_KEYS[shownPublishing.failure]),
                  shownPublishing.said,
                ]
                  .filter((part) => part !== '')
                  .join(' '),
              }),
              isFailed: true,
            },
    isPublishOpen,
    publishTitle: t('PLAN.PUBLISH_TITLE', { workspace: workspace?.name ?? '' }),
    onPublish: () => {
      if (published === null) {
        setIsPublishOpen(true);

        return;
      }

      void publish({
        pageId: published.page.id,
        spaceId: published.spaceId,
        parentId: published.parentId,
        title: published.page.title,
      });
    },
    onConfirmPublish: (choice: {
      spaceId: string;
      parentId: string | null;
      title: string;
    }) => {
      setIsPublishOpen(false);
      void publish({ pageId: null, ...choice });
    },
    onCancelPublish: () => {
      setIsPublishOpen(false);
    },
    onDismissPublish: () => {
      setPublishing(null);
    },
    exportLabel: t('PLAN.EXPORT'),
    canExport: plan.length > 0 && !isLocked && target !== null,
    exportNotice:
      exported === null || exported.kind === 'cancelled'
        ? null
        : exported.kind === 'saved'
          ? [
              t('PLAN.EXPORTED', {
                files: exported.files.join(', '),
                folder: exported.folder,
              }),
              ...(exported.missing.length === 0
                ? []
                : [t('PLAN.EXPORT_MISSING', { cases: exported.missing.join(', ') })]),
            ].join(' ')
          : exported.kind === 'nothing'
            ? t('PLAN.EXPORT_NOTHING')
            : t(
                exported.reason === 'app-id'
                  ? 'PLAN.EXPORT_NO_APP_ID'
                  : 'PLAN.EXPORT_FAILED',
              ),
    dismissExportLabel: t('COMMON.CLOSE'),
    onExport: () => {
      if (workspaceId === null || target === null) return;

      const viewport = viewportOf(workspace?.viewportId);

      void Run.exportCode({
        workspaceId,
        target: { kind: target.kind, value: target.value },
        viewport: { width: viewport.width, height: viewport.height },
        steps: flattenPlanSteps(plan),
      }).then(setExported);
    },
    onDismissExport: () => {
      setExported(null);
    },
    onDraftInChat: () => {
      selectTab('chat');
    },
    freshCaseId,
    onAddCase: () => {
      const added = addCase({
        plan,
        used: caseIdsUsed({
          plan,
          runs: workspace?.runs ?? [],
          bugs: workspace?.bugs ?? [],
        }),
      });
      const fresh = added.at(-1)?.id ?? null;

      write(added);
      setFreshCaseId(fresh);
      if (fresh !== null && openCaseId !== fresh) toggleCase(fresh);
    },
    undo:
      undoable === null
        ? null
        : {
            key: undoable.key,
            text: t('PLAN.CASE_REMOVED', { id: undoable.caseId }),
            actionLabel: t('PLAN.UNDO'),
          },
    onRemoveCase: (caseId: string) => {
      if (workspaceId === null || isLocked) return;

      const after = removeCase({ plan, caseId });

      write(after);
      setRemoval({
        key: `${caseId}@${String(Date.now())}`,
        workspaceId,
        caseId,
        before: plan,
        after,
      });
    },
    onUndo: () => {
      if (undoable === null) return;

      write(undoable.before);
      setRemoval(null);
    },
    onUndoExpire: () => {
      setRemoval(null);
    },
    onMoveCase: (props: { caseId: string; by: -1 | 1 }) => {
      write(moveCase({ plan, ...props }));
    },
    onEditCase: (props: { caseId: string; fields: Partial<ITestCase> }) => {
      write(editCase({ plan, ...props }));
    },
    onAddStep: (caseId: string) => {
      write(addStep({ plan, caseId }));
    },
    onRemoveStep: (props: { caseId: string; index: number }) => {
      write(removeStep({ plan, ...props }));
    },
    onEditStep: (props: { caseId: string; index: number; step: Partial<ITestStep> }) => {
      write(editStep({ plan, ...props }));
    },
  };
};
