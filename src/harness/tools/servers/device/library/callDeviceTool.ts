import type { IAttachDevice, ToolAnswer } from '@/harness/tools/servers/device/types';
import { stripAnsi } from '@/harness/library';
import { actionOfToolCall } from './actionOfToolCall';
import { reportOfToolCall } from './reportOfToolCall';

function said(text: string, isError = false): ToolAnswer {
  return { content: [{ type: 'text', text }], isError };
}

/** Carries out one device tool call and says back what the device shows, or why it could not. */
export async function callDeviceTool(props: {
  device: IAttachDevice;
  call: { name: string; args: Record<string, unknown> | undefined };
}): Promise<ToolAnswer> {
  const { device } = props;
  const { name, args } = props.call;

  try {
    if (name === 'look') return said(await device.driver.describe());

    if (name === 'report') {
      const read = reportOfToolCall(args);

      if ('error' in read) return said(read.error, true);

      if (!device.onReport) return said('There is no run to report to.', true);

      return said(await device.onReport(read.report));
    }

    const read = actionOfToolCall({ name, args });

    if ('error' in read) return said(read.error, true);

    await device.driver.act(read.action);

    return said(`Done. The device now shows:\n${await device.driver.describe()}`);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);

    return said(`That did not work: ${stripAnsi(message)}`, true);
  }
}
