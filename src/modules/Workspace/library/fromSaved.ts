import type { ITestCase } from '@/modules/Plan';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { ISavedWorkspace } from '@/types';
import { parse } from 'yaml';

function readPlan(yaml: string): ITestCase[] {
  try {
    const read = parse(yaml) as { cases?: unknown };

    return Array.isArray(read.cases) ? (read.cases as ITestCase[]) : [];
  } catch {
    return [];
  }
}

/** A file somebody edited by hand may be nonsense, so what cannot be read is left out. */
export function fromSaved(saved: ISavedWorkspace): IWorkspace | null {
  let read: Partial<IWorkspace>;

  try {
    read = JSON.parse(saved.json) as Partial<IWorkspace>;
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
    sessionId: read.sessionId ?? null,
    status: read.status ?? 'idle',
    issue: read.issue ?? null,
    chat: (read.chat ?? []).filter((message) => (message.kind as string) !== 'action'),
    plan: readPlan(saved.planYaml),
    runs: read.runs ?? [],
    bugs: read.bugs ?? [],
    live: null,
    hasBeenAsked: read.hasBeenAsked ?? false,
    context:
      typeof read.context?.tokens === 'number' && typeof read.context.window === 'number'
        ? { tokens: read.context.tokens, window: read.context.window }
        : null,
  };
}
