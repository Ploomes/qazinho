import type { ICaseRemoval } from '@/modules/Plan/screens/Plan/types';
import type { ITestCase, ITestStep } from '@/modules/Plan/types';
import type { IRunCase } from '@/modules/Run';
import type { ExportOutcome } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { viewportOf } from '@/modules/Device';
import {
  addCase,
  addStep,
  caseIdsUsed,
  editCase,
  editStep,
  removeCase,
  removeStep,
} from '@/modules/Plan/library';
import { PLAN_SOURCE } from '@/modules/Plan/screens/Plan/constants';
import { flattenPlanSteps, useRunActions } from '@/modules/Run';
import { Run } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const usePlanViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    plan: opened.plan,
    planSource: opened.planSource,
    sourcePage: opened.sourcePage,
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
  const [exported, setExported] = useState<ExportOutcome | null>(null);

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
    onAddCase: () => {
      write(
        addCase({
          plan,
          used: caseIdsUsed({
            plan,
            runs: workspace?.runs ?? [],
            bugs: workspace?.bugs ?? [],
          }),
        }),
      );
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
