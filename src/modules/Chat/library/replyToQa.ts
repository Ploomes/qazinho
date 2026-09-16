import type { ChatMessage } from '@/modules/Chat/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { flattenPlanSteps } from '@/modules/Run/library';
import { draftPlan } from '@/modules/Workspace/library';

/** Stands in for the agent answering over ACP: it drafts once, then only acknowledges. */
export function replyToQa(props: {
  workspace: IWorkspace;
  kind: 'web' | 'mobile';
  at: string;
}): IWorkspace {
  const { workspace, kind, at } = props;
  const id = (offset: number) => `m-${String(workspace.chat.length + offset)}`;

  if (workspace.plan.length > 0) {
    const text =
      workspace.runs.length === 0
        ? 'Noted. Hit Run plan when you want me to go, or tell me what to change first.'
        : 'Noted. I kept the plan as it is.';

    return {
      ...workspace,
      chat: [...workspace.chat, { id: id(1), kind: 'agent', at, who: 'Claude', text }],
    };
  }

  const plan = draftPlan(kind);
  const stepCount = flattenPlanSteps(plan).length;

  const drafted: ChatMessage[] = [
    {
      id: id(1),
      kind: 'agent',
      at,
      who: 'Claude',
      text: `Four cases, ${String(stepCount)} steps, drafted from what you wrote. I split the payment case in two so a failure there does not take the rest of the plan down with it.`,
    },
    { id: id(2), kind: 'plan', at, caseCount: plan.length, stepCount },
  ];

  const asking: ChatMessage[] =
    kind === 'mobile'
      ? [
          {
            id: id(3),
            kind: 'ask',
            at,
            text: 'Sign up wants a phone number that can take an SMS on this build. Which one should I use?',
            holdingFor: '4m 12s',
            options: [
              {
                label: 'Use the sandbox number',
                reply: 'Use the sandbox number.',
                isPrimary: true,
              },
              { label: 'I will type one', reply: 'I will type one.', isPrimary: false },
              { label: 'Skip that case', reply: 'Skip that case.', isPrimary: false },
            ],
          },
        ]
      : [];

  return {
    ...workspace,
    plan,
    chat: [...workspace.chat, ...drafted, ...asking],
    status: kind === 'mobile' ? 'attention' : workspace.status,
    hasBeenAsked: kind === 'mobile',
  };
}
