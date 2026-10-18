import type { IAttachDevice, ToolAnswer } from '@/harness/tools/servers/device/types';
import { stripAnsi } from '@/harness/library';
import { describeMotion } from './describeMotion';
import { readToolCall } from './readToolCall';

function said(text: string, isError = false): ToolAnswer {
  return { content: [{ type: 'text', text }], isError };
}

async function shown(props: {
  device: IAttachDevice;
  lead: string;
}): Promise<ToolAnswer> {
  const { driver } = props.device;
  const [text, image] = await Promise.all([
    driver.describe(),
    driver.glance().catch(() => null),
  ]);

  return {
    content: [
      { type: 'text', text: `${props.lead}${text}` },
      ...(image === null ? [] : [{ type: 'image' as const, ...image }]),
    ],
    isError: false,
  };
}

/** Carries out one device tool call and answers with the screen as text and as a picture, or why it could not. */
export async function callDeviceTool(props: {
  device: IAttachDevice;
  call: { name: string; args: Record<string, unknown> | undefined };
}): Promise<ToolAnswer> {
  const { device } = props;
  const read = readToolCall(props.call);

  try {
    if (read.kind === 'refused') return said(read.error, true);

    if (read.kind === 'look') return await shown({ device, lead: '' });

    if (read.kind === 'report') {
      if (!device.onReport) return said('There is no run to report to.', true);

      return said(await device.onReport(read.report));
    }

    await device.driver.act(read.action);

    const motion = describeMotion(await device.driver.motion());

    return await shown({
      device,
      lead: `Done.${motion === null ? '' : ` ${motion}`} The device now shows:\n`,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : String(reason);

    return said(`That did not work: ${stripAnsi(message)}`, true);
  }
}
