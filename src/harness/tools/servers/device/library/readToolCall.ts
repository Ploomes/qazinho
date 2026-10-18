import type { DeviceToolCall } from '@/harness/tools/servers/device/types';
import { DEVICE_TOOLS } from '@/harness/tools/servers/device/constants';

/** Reads a tool call against the tool's own schema; a call that breaks it is refused with the reason. */
export function readToolCall(props: {
  name: string;
  args: Record<string, unknown> | undefined;
}): DeviceToolCall {
  const tool = DEVICE_TOOLS.find(({ name }) => name === props.name);

  if (!tool)
    return { kind: 'refused', error: `There is no tool called "${props.name}".` };

  if (tool.name === 'report') {
    const read = tool.input.safeParse(props.args ?? {});

    if (!read.success)
      return { kind: 'refused', error: read.error.issues[0]?.message ?? 'Report again.' };

    return {
      kind: 'report',
      report: {
        ...read.data,
        title: read.data.title ?? '',
        severity: read.data.severity ?? 'medium',
        note: read.data.note ?? '',
      },
    };
  }

  const read = tool.input.safeParse(props.args ?? {});

  if (!read.success)
    return { kind: 'refused', error: read.error.issues[0]?.message ?? 'Call it again.' };

  if (tool.name === 'look') return { kind: 'look' };

  const args = read.data as { target?: string; value?: string };

  return {
    kind: 'act',
    action: {
      kind: tool.name,
      target: args.target ?? '',
      value: args.value ?? '',
    },
  };
}
