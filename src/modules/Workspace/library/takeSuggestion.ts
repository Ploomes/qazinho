import type { IWorkspace } from '@/modules/Workspace/types';
import { appendPlanCard } from '@/modules/Chat/library';
import { caseIdsUsed, planOfDraft } from '@/modules/Plan/library';

/**
 * Leva os casos sugeridos, ou só os que o QA escolheu, ao plano: um que nomeia um caso do
 * plano o muda, e os outros vêm depois; uma sugestão é levada uma vez.
 */
export function takeSuggestion(props: {
  workspace: IWorkspace;
  messageId: string;
  at: string;
  only?: number[];
}): IWorkspace {
  const { workspace, messageId, at, only } = props;
  const message = workspace.chat.find(({ id }) => id === messageId);

  if (message?.kind !== 'suggestion' || message.isTaken) return workspace;

  const chosen = message.cases.filter(
    (_, index) => only === undefined || only.includes(index),
  );
  const plan = planOfDraft({
    cases: [
      ...workspace.plan.map(
        (testCase) => chosen.find(({ id }) => id === testCase.id) ?? testCase,
      ),
      ...chosen.filter(({ id }) => !workspace.plan.some((one) => one.id === id)),
    ],
    plan: workspace.plan,
    used: caseIdsUsed(workspace),
  });

  if (plan === null) return workspace;

  const taken: IWorkspace = {
    ...workspace,
    chat: workspace.chat.map((one) =>
      one.id === messageId && one.kind === 'suggestion' ? { ...one, isTaken: true } : one,
    ),
  };

  return appendPlanCard({ workspace: taken, plan, at });
}
