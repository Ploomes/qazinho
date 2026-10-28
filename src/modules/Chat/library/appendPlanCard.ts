import type { ITestCase } from '@/modules/Plan';
import type { IWorkspace } from '@/modules/Workspace';
import { keepVerdicts } from '@/modules/Plan/library';
import { flattenPlanSteps } from '@/modules/Run/library';

/**
 * O plano nunca cai no chat como texto: o cartão o entrega à aba Plano, mantendo os
 * vereditos dos casos que manteve.
 */
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
