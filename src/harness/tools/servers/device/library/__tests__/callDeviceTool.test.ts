import type { IAttachDevice, IStepReport } from '@/harness/tools/servers/device/types';
import type { IActionMotion, IDeviceImage, IStepAction } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { callDeviceTool } from '@/harness/tools/servers/device/library';

const PICTURE: IDeviceImage = { data: 'aGVsbG8=', mimeType: 'image/jpeg' };

/** A device that remembers what it was asked to do, and shows one fixed screen and picture. */
function fakeDevice(
  props: {
    fails?: string;
    onReport?: IAttachDevice['onReport'];
    image?: IDeviceImage | null;
    motion?: IActionMotion | null;
    blind?: boolean;
  } = {},
) {
  const acted: IStepAction[] = [];
  const device: IAttachDevice = {
    workspaceId: 'w1',
    driver: {
      describe: async () => 'Cart · [button] Apply',
      glance: async () => {
        if (props.blind === true) throw new Error('no screencap');
        return props.image === undefined ? PICTURE : props.image;
      },
      motion: async () => props.motion ?? null,
      act: async (action) => {
        if (props.fails !== undefined) throw new Error(props.fails);
        acted.push(action);
      },
    },
    onReport: props.onReport,
  };

  return { device, acted };
}

type Answer = Awaited<ReturnType<typeof callDeviceTool>>;

const text = (answer: Answer) => {
  const first = answer.content[0];

  return first?.type === 'text' ? first.text : undefined;
};

const images = (answer: Answer) => answer.content.filter(({ type }) => type === 'image');

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

  describe('what the agent sees', () => {
    it('hands over a picture of the screen with the text, on look and after an action', async () => {
      const { device } = fakeDevice();

      for (const call of [
        { name: 'look', args: {} },
        { name: 'click', args: { target: 'Apply' } },
      ])
        expect(images(await callDeviceTool({ device, call }))).toEqual([
          { type: 'image', ...PICTURE },
        ]);
    });

    it('answers with the text alone when the device has no picture, or fails to take one', async () => {
      for (const device of [
        fakeDevice({ image: null }).device,
        fakeDevice({ blind: true }).device,
      ]) {
        const answer = await callDeviceTool({ device, call: { name: 'look', args: {} } });

        expect(answer.isError).toBe(false);
        expect(images(answer)).toEqual([]);
      }
    });

    it('says how the page moved while it acted', async () => {
      const { device } = fakeDevice({
        motion: {
          shift: 0.31,
          unexpectedShift: 0.31,
          shifts: 2,
          longFrames: 1,
          slowestFrameMs: 180,
        },
      });
      const answer = await callDeviceTool({
        device,
        call: { name: 'click', args: { target: 'Apply' } },
      });

      expect(text(answer)).toMatch(/^Done\. While it acted, the layout shifted 0\.31/);
    });

    it('says nothing about motion for a device that cannot measure it', async () => {
      const { device } = fakeDevice({ motion: null });
      const answer = await callDeviceTool({
        device,
        call: { name: 'click', args: { target: 'Apply' } },
      });

      expect(text(answer)).toMatch(/^Done\. The device now shows:/);
    });
  });
});
