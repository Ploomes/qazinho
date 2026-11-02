import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { runDayOf, walkedStepsOf } from '@/modules/Run/library';
import { countOf } from './countOf';
import { openRoundOf } from './openRoundOf';

const ENDINGS = {
  finished: 'walked to the end',
  stopped: 'stopped by the QA',
  broke: 'broke before the end',
  interrupted: 'cut short when QAzinho closed',
} as const;

/**
 * Um workspace inteiro para o assistente: alvo, design, plano, runs, bugs e o que ele
 * espera.
 */
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
    ...(workspace.design === null
      ? []
      : [
          `It is checked against the Figma design "${workspace.design.name}": ${workspace.design.url}. Its chat reads it through the QA's own Figma, and each run holds the steps that name a frame to that frame.`,
        ]),
    ...(workspace.plan.length === 0
      ? ['It has no plan yet: its chat writes one with the QA.']
      : [
          `Its plan has ${countOf({ amount: workspace.plan.length, noun: 'case' })} and ${countOf({ amount: steps, noun: 'step' })}:`,
          ...workspace.plan.flatMap((testCase) => [
            `- ${testCase.id} "${testCase.title}" · ${testCase.priority} · last run ${testCase.lastVerdict ?? 'never'}`,
            ...(testCase.goal.trim() === '' ? [] : [`  goal: ${testCase.goal}`]),
            ...(testCase.preconditions.trim() === ''
              ? []
              : [`  before: ${testCase.preconditions}`]),
            ...testCase.steps.map(
              (step, index) =>
                `  ${String(index + 1)}. ${step.action} → ${step.expected}${step.frame === undefined ? '' : ` [frame ${step.frame}]`}`,
            ),
          ]),
        ]),
    ...(workspace.runs.length === 0
      ? ['No runs yet.']
      : [
          'Runs, newest first:',
          ...workspace.runs.map((run) => {
            const day = runDayOf(run);

            return `- ${run.id} ${day === null ? '' : `on ${day} `}at ${run.startedAt}, ${ENDINGS[run.endedBy]}: ${String(run.counts.passed)} passed, ${String(run.counts.failed)} failed, ${String(run.counts.blocked)} blocked, ${String(run.counts.skipped)} skipped`;
          }),
        ]),
    ...(workspace.bugs.length === 0
      ? ['No bugs.']
      : [
          'Bugs:',
          ...workspace.bugs.map(
            (bug) =>
              `- ${bug.id} · ${bug.severity} · "${bug.title}" · ${bug.caseId} step ${String(bug.stepNumber)} · ${bug.runId}${bug.frame === null ? '' : ` · off the design, frame ${bug.frame}`}${bug.isDismissed ? ' · the QA said it is no bug' : ''}`,
          ),
        ]),
    ...(live === null || live.isDone
      ? []
      : [
          live.kind === 'explore'
            ? `An exploration is ${live.isRunning ? 'going on' : 'paused'} now: ${live.id}, ${String(live.outcomes.length)} screens noted so far. It has no plan steps to count.`
            : `A run is ${live.isRunning ? 'going on' : 'paused'} now: ${live.id}, ${String(live.outcomes.length)} of ${String(walkedStepsOf({ plan: workspace.plan, caseIds: live.caseIds }).length)} steps walked.`,
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
