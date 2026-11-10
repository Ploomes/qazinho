import type { ICaseRemoval, IPlanSource } from '@/modules/Plan/screens/Plan/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run';
import type { ExportOutcome, PlanPublished, UnreadPlanRead } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { viewportOf } from '@/modules/Device';
import { usePlanDocument } from '@/modules/Plan/hooks/usePlanDocument';
import {
  addCase,
  addStep,
  caseIdsUsed,
  editCase,
  editStep,
  freeVariableName,
  liveCasesOf,
  missingVariablesOf,
  moveCase,
  planOfYaml,
  planWithRestored,
  planWithSecretNamed,
  removeCase,
  removeStep,
  writtenSecretsOf,
} from '@/modules/Plan/library';
import {
  PLAN_NO_CASES,
  PLAN_NO_FILES,
  PLAN_SOURCE,
} from '@/modules/Plan/screens/Plan/constants';
import { bytesLabelOf, useProUpdate } from '@/modules/Pro';
import { useVariableActions, VARIABLE_FAILURE_KEYS } from '@/modules/Project';
import { flattenPlanSteps, planStageOf, useRunActions } from '@/modules/Run';
import { CONFLUENCE_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Archive, Confluence, Run } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useToTop } from '@/shared/hooks/useToTop';
import {
  useAppStore,
  useProStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { documentOf } = usePlanDocument();
  const { topRef, isToTopShown, onToTop } = useToTop();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    name: opened.name,
    plan: opened.plan,
    planSource: opened.planSource,
    sourcePage: opened.sourcePage,
    published: opened.published,
    unreadPlan: opened.unreadPlan,
    plainValues: opened.plainValues,
    issue: opened.issue,
    design: opened.design,
    isLocked: opened.live !== null && !opened.live.isDone,
    liveOutcomes: opened.live?.outcomes ?? null,
    liveDoingIndex: opened.live?.doingIndex ?? -1,
    liveCaseIds: opened.live?.caseIds,
    liveIsDone: opened.live?.isDone ?? true,
    liveIsRunning: opened.live?.isRunning ?? false,
    liveQuestion: opened.live?.question,
    liveKind: opened.live?.kind,
    liveHow: opened.live?.how ?? null,
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
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const { onRunCase, onStop } = useRunActions();
  const { update: updateFromOrg } = useProUpdate();
  const [removal, setRemoval] = useState<ICaseRemoval | null>(null);
  const [freshCaseId, setFreshCaseId] = useState<string | null>(null);
  const [exportedIn, setExportedIn] = useState<{
    workspaceId: string;
    outcome: ExportOutcome;
  } | null>(null);
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
  const setUnreadPlan = useWorkspaceStore((state) => state.setUnreadPlan);
  const keepPlain = useWorkspaceStore((state) => state.keepPlain);
  const [reread, setReread] = useState<{
    workspaceId: string;
    read: Exclude<UnreadPlanRead, { status: 'read' }>;
  } | null>(null);
  const kept = useVariablesStore((state) => state.byProject[workspace?.projectId ?? '']);
  const developedIds = useWorkspaceStore(
    (state) => state.developedCases[workspace?.id ?? ''] ?? PLAN_NO_CASES,
  );
  const planFiles = useWorkspaceStore(
    (state) => state.planFiles[workspace?.id ?? ''] ?? PLAN_NO_FILES,
  );
  const isInOrg = useProStore((state) =>
    state.shares.some(
      ({ projectId, orgSlug }) => projectId === workspace?.projectId && orgSlug !== null,
    ),
  );
  const { askVariables, applyVariables } = useVariableActions();
  const [secretFailure, setSecretFailure] = useState<{
    workspaceId: string;
    text: string;
  } | null>(null);

  const workspaceId = workspace?.id ?? null;
  const exported = exportedIn?.workspaceId === workspaceId ? exportedIn.outcome : null;
  const plan = workspace?.plan ?? [];
  const isLocked = workspace?.isLocked === true;
  const orgMove = useProStore(
    (state) =>
      state.shares
        .find(({ projectId }) => projectId === workspace?.projectId)
        ?.conflicts.find(({ workspaceId: id }) => id === workspace?.id) ?? null,
  );

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
  const unreadPlan = workspace?.unreadPlan ?? null;
  const written = writtenSecretsOf(plan).filter(
    ({ value }) => !(workspace?.plainValues ?? []).includes(value),
  );
  const secret = written[0] ?? null;
  const shownReread =
    reread !== null && reread.workspaceId === workspaceId ? reread.read : null;
  const missing = missingVariablesOf({
    plan,
    kept: (kept ?? []).map(({ name }) => name),
  });
  const shownPublishing =
    publishing !== null && publishing.workspaceId === workspaceId
      ? publishing.outcome
      : null;

  const readUnread = async () => {
    if (workspaceId === null || unreadPlan === null) return;

    const read = await Archive.readUnreadPlan({ workspaceId, file: unreadPlan.file });

    if (read.status !== 'read') {
      setReread({ workspaceId, read });

      return;
    }

    setReread(null);
    setPlan({
      workspaceId,
      plan: planWithRestored({ plan, restored: planOfYaml(read.yaml) }),
    });
    setUnreadPlan({ workspaceId, unreadPlan: null });
  };

  const keepSecret = async () => {
    if (workspace === null || workspaceId === null || secret === null || isLocked) return;

    const name = freeVariableName({
      base: secret.kind === 'password' ? 'PASSWORD' : 'TOKEN',
      taken: (kept ?? []).map((variable) => variable.name),
    });
    const outcome = await applyVariables({
      projectId: workspace.projectId,
      changes: [
        {
          kind: 'save',
          name,
          description: t(
            secret.kind === 'password'
              ? 'PLAN.SECRET_PASSWORD_HOLDS'
              : 'PLAN.SECRET_TOKEN_HOLDS',
            { caseId: secret.caseId },
          ),
          value: secret.value,
          from: null,
        },
      ],
    });

    if (!outcome.isSaved) {
      setSecretFailure({
        workspaceId,
        text: t(VARIABLE_FAILURE_KEYS[outcome.failure.reason], {
          name: 'name' in outcome.failure ? outcome.failure.name : name,
        }),
      });

      return;
    }

    const now = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === workspaceId);

    setSecretFailure(null);
    if (now !== undefined)
      setPlan({
        workspaceId,
        plan: planWithSecretNamed({ plan: now.plan, value: secret.value, name }),
      });
  };

  const publish = async (props: {
    pageId: string | null;
    spaceId: string;
    parentId: string | null;
    title: string;
  }) => {
    if (workspaceId === null || isPublishing) return;

    setIsPublishing(true);

    const outcome = await Confluence.publish({
      ...props,
      blocks: documentOf({
        plan,
        runs: workspace?.runs ?? [],
        issue,
        sourcePage,
        design: workspace?.design ?? null,
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
  const stage = planStageOf({ plan, developed: developedIds });
  const liveCases =
    workspace === null || workspace.liveOutcomes === null
      ? {}
      : liveCasesOf({
          plan,
          live: {
            outcomes: workspace.liveOutcomes,
            doingIndex: workspace.liveDoingIndex,
            caseIds: workspace.liveCaseIds,
            isDone: workspace.liveIsDone,
            isRunning: workspace.liveIsRunning,
            question: workspace.liveQuestion,
            kind: workspace.liveKind,
          },
        });
  const lastRuns: Record<string, IRunCase> = Object.fromEntries(
    (latest?.cases ?? [])
      .filter(({ id }) => !Object.hasOwn(liveCases, id))
      .map((runCase) => [runCase.id, runCase]),
  );
  const liveRuns = Object.entries(liveCases).flatMap(([id, { run }]) =>
    run === null ? [] : [[id, run] as const],
  );

  return {
    topRef,
    onToTop,
    secretNotice:
      secret === null || isLocked
        ? null
        : {
            text: t(
              secret.kind === 'password' ? 'PLAN.SECRET_PASSWORD' : 'PLAN.SECRET_TOKEN',
              { caseId: secret.caseId },
            ),
            failure:
              secretFailure !== null && secretFailure.workspaceId === workspaceId
                ? secretFailure.text
                : null,
            keepLabel: t('PLAN.SECRET_KEEP'),
            plainLabel: t('PLAN.SECRET_PLAIN'),
          },
    onPlainSecret: () => {
      if (workspaceId !== null && secret !== null)
        keepPlain({ workspaceId, value: secret.value });
    },
    onKeepSecret: () => {
      void keepSecret();
    },
    unread:
      unreadPlan === null
        ? null
        : {
            text: t(unreadPlan.line === null ? 'PLAN.UNREAD_SHAPE' : 'PLAN.UNREAD_LINE', {
              line: unreadPlan.line ?? 0,
              file: unreadPlan.file,
            }),
            again:
              shownReread === null
                ? null
                : shownReread.status === 'gone'
                  ? t('PLAN.UNREAD_GONE', { file: unreadPlan.file })
                  : shownReread.line === null
                    ? t('PLAN.UNREAD_STILL_SHAPE')
                    : t('PLAN.UNREAD_STILL', { line: shownReread.line }),
            canRead: shownReread?.status !== 'gone' && !isLocked,
            showLabel: t('PLAN.UNREAD_SHOW'),
            readLabel: t('PLAN.UNREAD_READ'),
            dismissLabel: t('COMMON.CLOSE'),
          },
    onShowUnread: () => {
      if (workspaceId !== null && unreadPlan !== null)
        Archive.showUnreadPlan({ workspaceId, file: unreadPlan.file });
    },
    onReadUnread: () => {
      void readUnread();
    },
    onDismissUnread: () => {
      if (workspaceId === null) return;

      setReread(null);
      setUnreadPlan({ workspaceId, unreadPlan: null });
    },
    plan,
    lastRuns: { ...lastRuns, ...Object.fromEntries(liveRuns) },
    developedIds,
    filesNotice:
      isInOrg && planFiles.length > 0
        ? {
            text: t(
              planFiles.length === 1 ? 'PLAN.FILES_IN_ORG_ONE' : 'PLAN.FILES_IN_ORG',
              {
                count: planFiles.length,
                size: bytesLabelOf({
                  bytes: planFiles.reduce((sum, { size }) => sum + size, 0),
                  language,
                }),
              },
            ),
            tip: t('PLAN.FILES_IN_ORG_TIP'),
          }
        : null,
    stages: {
      total: stage.total,
      developed: stage.developed.length,
      how:
        isLocked && workspace?.liveKind !== 'explore'
          ? (workspace?.liveHow ?? null)
          : null,
    },
    liveStatuses: Object.fromEntries(
      Object.entries(liveCases).map(([id, { status }]) => [id, status]),
    ),
    design: workspace?.design ?? null,
    openCaseId,
    isLocked,
    lockedLabel: t('PLAN.LOCKED', { agent }),
    isEmpty: plan.length === 0,
    sources: [
      ...(sourcePage === null
        ? []
        : [
            {
              key: 'page',
              label: t('PLAN.FROM_PAGE'),
              tag: null,
              title: sourcePage.title,
              url: sourcePage.url,
            },
          ]),
      ...(source === null
        ? []
        : [
            {
              key: 'code',
              label: t('PLAN.FROM_CODE'),
              tag: source.repository,
              title:
                source.branch === source.base
                  ? t('PLAN.SOURCE_WHOLE', {
                      branch: source.branch,
                      commit: source.commit.slice(0, PLAN_SOURCE.shaLength),
                    })
                  : t('PLAN.SOURCE', {
                      branch: source.branch,
                      base: source.base,
                      commit: source.commit.slice(0, PLAN_SOURCE.shaLength),
                    }),
              url: null,
            },
          ]),
      ...(published === null
        ? []
        : [
            {
              key: 'published',
              label: t('PLAN.PUBLISHED_ON'),
              tag: null,
              title: published.page.title,
              url: published.page.url,
            },
          ]),
    ] satisfies IPlanSource[],
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
    onRunCase,
    onStop,
    missingNotice:
      missing.length === 0 || isLocked
        ? null
        : t(missing.length === 1 ? 'PLAN.MISSING_ONE' : 'PLAN.MISSING_OTHER', {
            names: missing.map((name) => `\${${name}}`).join(', '),
          }),
    orgNotice:
      orgMove === null || isLocked
        ? null
        : t('PLAN.ORG_MOVED', { who: orgMove.editedBy ?? t('PLAN.ORG_SOMEONE') }),
    orgUpdateLabel: t('PLAN.ORG_UPDATE'),
    onOrgUpdate: () => {
      if (workspace !== null) void updateFromOrg(workspace.projectId);
    },
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
          ? t('PLAN.EXPORTED', { folder: exported.folder.split(/[\\/]/).at(-1) ?? '' })
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
      }).then((outcome) => {
        setExportedIn({ workspaceId, outcome });
      });
    },
    onDismissExport: () => {
      setExportedIn(null);
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
    isToTopShown: isToTopShown && undoable === null,
    undo:
      undoable === null
        ? null
        : {
            key: undoable.key,
            text: t('PLAN.CASE_REMOVED', { id: undoable.caseId }),
            actionLabel: t('PLAN.UNDO'),
          },
    onOpenBug: (bugId: string) => {
      if (openBugId !== bugId) toggleBug(bugId);

      selectTab('bugs');
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
