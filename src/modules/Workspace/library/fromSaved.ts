import type { IRun } from '@/modules/Run';
import type { IWorkspace, SavedBug, SavedMessage } from '@/modules/Workspace/types';
import type { ISavedWorkspace } from '@/shared/types';
import { viewportOf } from '@/modules/Device/library';
import { planOfYaml } from '@/modules/Plan/library';
import { bugOfSaved } from './bugOfSaved';
import { codeSourceOf } from './codeSourceOf';
import { messageOfSaved } from './messageOfSaved';

type SavedRun = Omit<IRun, 'endedBy' | 'costUsd' | 'video'> &
  Partial<Pick<IRun, 'endedBy' | 'costUsd' | 'video'>> & {
    title?: string;
    what?: string;
  };

/** A file somebody edited by hand may be nonsense, so what cannot be read is left out. */
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
    design: read.design ?? null,
    chat: (read.chat ?? []).map(messageOfSaved).filter((message) => message !== null),
    plan: planOfYaml(saved.planYaml),
    unreadPlan: saved.unreadPlan ?? read.unreadPlan ?? null,
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
