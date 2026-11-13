import type { IRun } from '@/modules/Run';
import type { IWorkspace, SavedBug, SavedMessage } from '@/modules/Workspace/types';
import type { ISavedWorkspace } from '@/shared/types';
import { viewportOf } from '@/modules/Device/library';
import { planExtrasOfYaml, planOfYaml } from '@/modules/Plan/library';
import { bugOfSaved } from './bugOfSaved';
import { changeReviewOf } from './changeReviewOf';
import { codeSourceOf } from './codeSourceOf';
import { messageOfSaved } from './messageOfSaved';
import { pendingChangeOf } from './pendingChangeOf';
import { snapshotsOf } from './snapshotsOf';

type SavedRun = Omit<IRun, 'endedBy' | 'costUsd' | 'video'> &
  Partial<Pick<IRun, 'endedBy' | 'costUsd' | 'video'>> & {
    title?: string;
    what?: string;
  };

/**
 * Um arquivo que alguém editou à mão pode ser bobagem, então o que não pode ser lido fica
 * de fora.
 */
export function fromSaved(saved: ISavedWorkspace): IWorkspace | null {
  let read: Partial<Omit<IWorkspace, 'chat' | 'bugs'>> & {
    chat?: SavedMessage[];
    bugs?: SavedBug[];
  };

  try {
    read = JSON.parse(saved.json) as typeof read;
  } catch {
    return null;
  }

  if (typeof read.id !== 'string' || typeof read.projectId !== 'string') return null;

  return {
    id: read.id,
    projectId: read.projectId,
    name: read.name ?? read.id,
    targetId: read.targetId ?? '',
    planKind: read.planKind ?? 'web',
    viewportId: viewportOf(read.viewportId).id,
    sessionId: read.sessionId ?? null,
    sessionAgentId: read.sessionAgentId ?? null,
    status: read.status ?? 'idle',
    issue: read.issue ?? null,
    ...(read.storyStage === 'ahead' || read.storyStage === 'arrived'
      ? { storyStage: read.storyStage }
      : {}),
    ...(snapshotsOf(read.snapshots).length === 0
      ? {}
      : { snapshots: snapshotsOf(read.snapshots) }),
    ...(pendingChangeOf(read.changed) === null
      ? {}
      : { changed: pendingChangeOf(read.changed) ?? undefined }),
    ...(changeReviewOf(read.review) === null
      ? {}
      : { review: changeReviewOf(read.review) ?? undefined }),
    design: read.design ?? null,
    chat: (read.chat ?? []).map(messageOfSaved).filter((message) => message !== null),
    plan: planOfYaml(saved.planYaml),
    ...planExtrasOfYaml(saved.planYaml),
    unreadPlan: saved.unreadPlan ?? read.unreadPlan ?? null,
    plainValues: read.plainValues ?? [],
    planSource: codeSourceOf(read.planSource),
    sourcePage: read.sourcePage ?? null,
    published: read.published ?? null,
    runs: ((read.runs ?? []) as SavedRun[]).map(
      ({ title: _title, what: _what, ...run }) => ({
        ...run,
        endedBy: run.endedBy ?? 'finished',
        costUsd: run.costUsd ?? null,
        video: run.video ?? null,
        cases: run.cases.map((runCase) => ({
          ...runCase,
          steps: runCase.steps.map((step) => ({ ...step, span: step.span ?? null })),
        })),
      }),
    ),
    bugs: (read.bugs ?? []).map(bugOfSaved),
    live: null,
    hasBeenAsked: read.hasBeenAsked ?? false,
    context:
      typeof read.context?.tokens === 'number' && typeof read.context.window === 'number'
        ? { tokens: read.context.tokens, window: read.context.window }
        : null,
  };
}
