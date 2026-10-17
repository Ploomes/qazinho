import type { ITestCase } from '@/modules/Plan';
import type { IWorkspace } from '@/modules/Workspace';
import { flattenPlanSteps } from '@/modules/Run/library';

/** The plan never lands in the chat as text: the card hands it to the Plan tab. */
export function appendPlanCard(props: {
  workspace: IWorkspace;
  plan: ITestCase[];
  at: string;
}): IWorkspace {
  const { workspace, plan, at } = props;

  return {
    ...workspace,
    plan,
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
