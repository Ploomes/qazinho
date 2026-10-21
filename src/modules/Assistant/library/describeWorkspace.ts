import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { openRoundOf } from './openRoundOf';

const ENDINGS = {
  finished: 'walked the whole plan',
  stopped: 'stopped by the QA',
  broke: 'broke before the end',
  interrupted: 'cut short when QAzinho closed',
} as const;

/** A workspace in full for the assistant: where it tests, its plan case by case, its runs, its bugs, a run going on, and the questions its chat waits on. */
export function describeWorkspace(props: {
  workspace: IWorkspace;
  project: IProject | null;
}): string {
  const { workspace, project } = props;
  const target = project?.targets.find(({ id }) => id === workspace.targetId) ?? null;
  const steps = workspace.plan.reduce(
    (total, testCase) => total + testCase.steps.length,
    0,
  );
  const live = workspace.live;
  const round = openRoundOf(workspace);

  return [
    `Workspace ${workspace.id} "${workspace.name}" in project ${project === null ? workspace.projectId : `${project.id} "${project.name}"`}, testing on ${target === null ? 'a target that is gone' : `${target.kind} ${target.value}`}.`,
    ...(workspace.plan.length === 0
      ? ['It has no plan yet: its chat writes one with the QA.']
      : [
          `Its plan has ${String(workspace.plan.length)} cases and ${String(steps)} steps:`,
          ...workspace.plan.flatMap((testCase) => [
            `- ${testCase.id} "${testCase.title}" · ${testCase.priority} · last run ${testCase.lastVerdict ?? 'never'}`,
            ...(testCase.goal.trim() === '' ? [] : [`  goal: ${testCase.goal}`]),
            ...(testCase.preconditions.trim() === ''
              ? []
              : [`  before: ${testCase.preconditions}`]),
            ...testCase.steps.map(
              (step, index) =>
                `  ${String(index + 1)}. ${step.action} → ${step.expected}`,
            ),
          ]),
        ]),
    ...(workspace.runs.length === 0
      ? ['No runs yet.']
      : [
          'Runs, newest first:',
          ...workspace.runs.map(
            (run) =>
              `- ${run.id} at ${run.startedAt}, ${ENDINGS[run.endedBy]}: ${String(run.counts.passed)} passed, ${String(run.counts.failed)} failed, ${String(run.counts.blocked)} blocked, ${String(run.counts.skipped)} skipped`,
          ),
        ]),
    ...(workspace.bugs.length === 0
      ? ['No bugs.']
      : [
          'Bugs:',
          ...workspace.bugs.map(
            (bug) =>
              `- ${bug.id} · ${bug.severity} · "${bug.title}" · ${bug.caseId} step ${String(bug.stepNumber)} · ${bug.runId}`,
          ),
        ]),
    ...(live === null || live.isDone
      ? []
      : [
          `A run is ${live.isRunning ? 'going on' : 'paused'} now: ${live.id}, ${String(live.outcomes.length)} of ${String(steps)} steps walked.`,
        ]),
    ...(round.length === 0
      ? []
      : [
          'Its chat agent asked the QA these questions, and waits on their answers in that chat, where the QA picks options or writes their own words:',
          ...round.map(
            (question, index) =>
              `${String(index + 1)}. ${question.header}: ${question.question} Options: ${question.options.map(({ label }) => label).join(' · ')}${question.isMultiSelect ? ', any of them' : ''}.`,
          ),
        ]),
  ].join('\n');
}
