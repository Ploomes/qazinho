import type { IFlatStep } from '@/shared/types';

/** The plan the workspace holds, written out so the agent can talk about it or change it. */
export function describePlan(steps: IFlatStep[]): string[] {
  if (steps.length === 0) return ['The workspace has no plan yet.'];

  const lines: string[] = ['The plan the workspace holds right now:'];
  let caseId = '';

  for (const step of steps) {
    if (step.caseId !== caseId) {
      caseId = step.caseId;
      lines.push(`${step.caseId} · ${step.caseTitle}`);
    }

    lines.push(`  ${String(step.numberInCase)}. ${step.action} → ${step.expected}`);
  }

  return lines;
}
