import type { IAttachDevice, IStepReport } from '@/harness/tools/servers/device/types';
import type { IStepAction } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { callDeviceTool } from '@/harness/tools/servers/device/library';

/** A device that remembers what it was asked to do, and shows one fixed screen. */
function fakeDevice(
  props: { fails?: string; onReport?: IAttachDevice['onReport'] } = {},
) {
  const acted: IStepAction[] = [];
  const device: IAttachDevice = {
    workspaceId: 'w1',
    driver: {
      describe: async () => 'Cart · [button] Apply',
      act: async (action) => {
        if (props.fails !== undefined) throw new Error(props.fails);
        acted.push(action);
      },
    },
    onReport: props.onReport,
  };

  return { device, acted };
}

const text = (answer: Awaited<ReturnType<typeof callDeviceTool>>) =>
  answer.content[0]?.text;

describe('callDeviceTool', () => {
  it('reads the screen on look', async () => {
    const { device } = fakeDevice();

    expect(text(await callDeviceTool({ device, call: { name: 'look', args: {} } }))).toBe(
      'Cart · [button] Apply',
    );
  });

  it('acts, then says what the device shows after', async () => {
    const { device, acted } = fakeDevice();
    const answer = await callDeviceTool({
      device,
      call: { name: 'click', args: { target: 'Apply' } },
    });

    expect(acted).toEqual([{ kind: 'click', target: 'Apply', value: '' }]);
    expect(answer.isError).toBe(false);
    expect(text(answer)).toContain('The device now shows:\nCart');
  });

  it('says back why an action failed, with no terminal colour codes', async () => {
    const ESC = String.fromCharCode(27);
    const { device } = fakeDevice({ fails: `${ESC}[2mTimeout${ESC}[22m` });
    const answer = await callDeviceTool({
      device,
      call: { name: 'click', args: { target: 'Apply' } },
    });

    expect(answer).toEqual({
      content: [{ type: 'text', text: 'That did not work: Timeout' }],
      isError: true,
    });
  });

  it('files a report with the run and passes on what comes next', async () => {
    const reports: IStepReport[] = [];
    const { device } = fakeDevice({
      onReport: async (report) => {
        reports.push(report);
        return 'Filed. Next is step 2';
      },
    });
    const answer = await callDeviceTool({
      device,
      call: {
        name: 'report',
        args: { step: 1, verdict: 'passed', why: 'It shows', got: 'Cart' },
      },
    });

    expect(reports).toHaveLength(1);
    expect(text(answer)).toBe('Filed. Next is step 2');
  });

  it('does NOT accept a report when there is no run to hear it', async () => {
    const { device } = fakeDevice();
    const answer = await callDeviceTool({
      device,
      call: {
        name: 'report',
        args: { step: 1, verdict: 'passed', why: 'It shows', got: 'Cart' },
      },
    });

    expect(answer.isError).toBe(true);
  });

  it('turns an unknown tool into an error the agent can read, without touching the device', async () => {
    const { device, acted } = fakeDevice();
    const answer = await callDeviceTool({ device, call: { name: 'swipe', args: {} } });

    expect(answer.isError).toBe(true);
    expect(acted).toEqual([]);
  });
});
