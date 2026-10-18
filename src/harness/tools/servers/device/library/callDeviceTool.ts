import type { IAttachDevice, ToolAnswer } from '@/harness/tools/servers/device/types';
import { stripAnsi } from '@/harness/library';
import { readToolCall } from './readToolCall';

function said(text: string, isError = false): ToolAnswer {
  return { content: [{ type: 'text', text }], isError };
}

/** Carries out one device tool call and says back what the device shows, or why it could not. */
export async function callDeviceTool(props: {
  device: IAttachDevice;
  call: { name: string; args: Record<string, unknown> | undefined };
}): Promise<ToolAnswer> {
  const { device } = props;
  const read = readToolCall(props.call);

  try {
    if (read.kind === 'refused') return said(read.error, true);

    if (read.kind === 'look') return said(await device.driver.describe());

    if (read.kind === 'report') {
      if (!device.onReport) return said('There is no run to report to.', true);

      return said(await device.onReport(read.report));
    }

    await device.driver.act(read.action);

    return said(`Done. The device now shows:\n${await device.driver.describe()}`);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);

    return said(`That did not work: ${stripAnsi(message)}`, true);
  }
}
