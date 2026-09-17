import type { IStepAction } from '@/types';

const ACTIONS = ['goto', 'click', 'fill', 'press', 'wait'];

/** A tool call the device can carry out, or a reason it cannot that goes back to the agent. */
export function actionOfToolCall(props: {
  name: string;
  args: Record<string, unknown> | undefined;
}): { action: IStepAction } | { error: string } {
  const { name, args } = props;

  if (!ACTIONS.includes(name)) return { error: `There is no tool called "${name}".` };

  const target = typeof args?.target === 'string' ? args.target : '';
  const value = typeof args?.value === 'string' ? args.value : '';

  if (name !== 'wait' && target.length === 0)
    return { error: `"${name}" needs a target: say what the control or URL is.` };

  if (name === 'fill' && typeof args?.value !== 'string')
    return { error: '"fill" needs a value: say what to type.' };

  return { action: { kind: name as IStepAction['kind'], target, value } };
}
