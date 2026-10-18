import type { ITestCase } from '@/modules/Plan';
import type { IWorkspace } from '@/modules/Workspace';
import { keepVerdicts } from '@/modules/Plan/library';
import { flattenPlanSteps } from '@/modules/Run/library';

/** The plan never lands in the chat as text: the card hands it to the Plan tab, keeping the verdicts of cases it kept. */
export function appendPlanCard(props: {
  workspace: IWorkspace;
  plan: ITestCase[];
  at: string;
}): IWorkspace {
  const { workspace, plan, at } = props;

  return {
    ...workspace,
    plan: keepVerdicts({ before: workspace.plan, after: plan }),
    chat: [
      ...workspace.chat,
      {
        id: `m-${String(workspace.chat.length + 1)}`,
        kind: 'plan',
        at,
        caseCount: plan.length,
        stepCount: flattenPlanSteps(plan).length,
      },
    ],
  };
}
