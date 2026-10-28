import type { IWorkspace } from '@/modules/Workspace/types';
import { appendPlanCard } from '@/modules/Chat/library';
import { caseIdsUsed, planOfDraft } from '@/modules/Plan/library';

/**
 * Leva os casos que uma exploração sugeriu ao plano, depois dos casos que ele já guarda,
 * e entrega o plano à aba dele; uma sugestão é levada uma vez.
 */
export function takeSuggestion(props: {
  workspace: IWorkspace;
  messageId: string;
  at: string;
}): IWorkspace {
  const { workspace, messageId, at } = props;
  const message = workspace.chat.find(({ id }) => id === messageId);

  if (message?.kind !== 'suggestion' || message.isTaken) return workspace;

  const plan = planOfDraft({
    cases: [...workspace.plan, ...message.cases],
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
