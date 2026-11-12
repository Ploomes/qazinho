// @vitest-environment jsdom
import type { INetworkEntry, ReplayFocus } from '@/modules/Run/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRunReplayViewModel } from '@/modules/Run/components/RunReplay/hooks/useRunReplayViewModel';
import {
  RECORDING,
  recordedRun,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

const URL = 'http://127.0.0.1:4000/t0k/w1/r-01';

function open(focus: ReplayFocus = { kind: 'run' }) {
  useAppStore.setState({ replay: { workspaceId: 'w1', runId: 'r-01', focus } });

  return renderHook(() => useRunReplayViewModel()).result;
}

const entry = (props: Partial<INetworkEntry>): INetworkEntry => ({
  id: 1,
  method: 'GET',
  url: 'https://shop.test/',
  type: 'document',
  status: 200,
  failure: null,
  startedAt: RECORDING.startedAt + 1_000,
  durationMs: 120,
  size: 1_884,
  ...props,
});

const NETWORK = [
  entry({ id: 1 }),
  entry({
    id: 2,
    url: 'https://shop.test/logo.png',
    type: 'image',
    status: 404,
    startedAt: RECORDING.startedAt + 2_000,
  }),
  entry({
    id: 3,
    method: 'POST',
    url: 'https://shop.test/api/pay',
    type: 'fetch',
    status: 500,
    startedAt: RECORDING.startedAt + 6_000,
    durationMs: 300,
  }),
];

function withNetwork(entries: INetworkEntry[] | null) {
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    replayUrl: () => Promise.resolve(URL),
    runNetwork: () => Promise.resolve(entries),
  };
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspaces: [recordedRun()] });
  window.qazinho = { ...fakeQazinhoApi('darwin'), replayUrl: () => Promise.resolve(URL) };
});

afterEach(() => {
  useAppStore.setState({ replay: null });
  useSettingsStore.setState({ replayNetwork: false });
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useRunReplayViewModel', () => {
  it('opens on the whole run, asks main where its video is, and offers to save it', async () => {
    const result = open();

    expect(result.current).toMatchObject({
      isOpen: true,
      kicker: 'Run r-01 · the whole plan',
      title: 'Checkout regression',
      timeText: '0:00 / 0:12',
    });
    await waitFor(() => {
      expect(result.current.url).toBe(URL);
    });
    expect(result.current.canSave).toBe(true);
  });

  it('says the video did not open when main has none on disk', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      replayUrl: () => Promise.resolve(null),
    };

    const result = open();

    await waitFor(() => {
      expect(result.current.hasFailed).toBe(true);
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.canSave).toBe(false);
  });

  it('says the video was let go of after so many days, rather than that it did not open', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      replayUrl: () => Promise.resolve(null),
      removedVideo: () =>
        Promise.resolve({ removedAt: '2026-10-20T10:00:00.000Z', afterDays: 30 }),
    };

    const result = open();

    await waitFor(() => {
      expect(result.current.missingText).toBe(
        'This run’s video was deleted after 30 days, to free space. Its report and screens stay.',
      );
    });
    expect(result.current.hasFailed).toBe(true);
  });

  it('stays shut for a run with no recording', () => {
    useWorkspaceStore.setState({
      workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
    });

    expect(open().current.isOpen).toBe(false);
  });

  describe('onSeek', () => {
    it('shows the case and the step at that moment', () => {
      const result = open();

      act(() => {
        result.current.onSeek(8_000);
      });

      expect(result.current.caption).toMatchObject({
        kicker: 'TC-02 · Step 2',
        text: 'Leave the house number empty',
      });
      expect(result.current.chapterLabel.text).toBe('TC-02 · Checkout with a test card');
      expect(result.current.timeText).toBe('0:08 / 0:12');
    });

    it('does NOT go past either end of the video', () => {
      const result = open();

      act(() => {
        result.current.onSeek(-500);
      });

      expect(result.current.currentMs).toBe(0);

      act(() => {
        result.current.onSeek(99_000);
      });

      expect(result.current.currentMs).toBe(12_000);
    });

    it('raises a bug once the video reaches it, and lets it go when the video goes back before it', () => {
      const result = open();

      act(() => {
        result.current.onSeek(9_400);
      });

      expect(result.current.flashBugId).toBeNull();

      act(() => {
        result.current.onSeek(9_700);
      });

      expect(result.current.flashBugId).toBe('BUG-01');

      act(() => {
        result.current.onSeek(3_000);
      });

      expect(result.current.flashBugId).toBeNull();
    });
  });

  describe('a take', () => {
    it("opens on a case's take, named after the case", () => {
      const result = open({ kind: 'case', caseId: 'TC-02' });

      expect(result.current).toMatchObject({
        kicker: 'Take · TC-02',
        title: 'Checkout with a test card',
        take: { fromMs: 5_500, toMs: 11_500 },
      });
    });

    it("opens on a bug's moment, named after the bug", () => {
      const result = open({ kind: 'bug', bugId: 'BUG-01' });

      expect(result.current).toMatchObject({
        kicker: 'The moment of BUG-01',
        title: 'Nothing happens on submit',
        take: { fromMs: 5_500, toMs: 11_000 },
      });
    });

    it('lets the take go, to watch the whole run', () => {
      const result = open({ kind: 'case', caseId: 'TC-02' });

      act(() => {
        result.current.onWatchWhole();
      });

      expect(result.current.take).toBeNull();
      expect(result.current.kicker).toBe('Run r-01 · the whole plan');
    });
  });

  describe('onRate', () => {
    it('goes faster on each press, and back to normal after the fastest', () => {
      const result = open();
      const rates = [result.current.rateLabel];

      for (let press = 0; press < 4; press += 1) {
        act(() => {
          result.current.onRate();
        });
        rates.push(result.current.rateLabel);
      }

      expect(rates).toEqual(['1×', '1.5×', '2×', '4×', '1×']);
    });
  });

  describe('keys', () => {
    it('jumps a case forward and back with ] and [', () => {
      const result = open();

      act(() => {
        result.current.onSeek(1_000);
      });
      press(']');

      expect(result.current.currentMs).toBe(5_500);

      press('[');

      expect(result.current.currentMs).toBe(0);
    });

    it('jumps five seconds with the arrows', () => {
      const result = open();

      press('ArrowRight');

      expect(result.current.currentMs).toBe(5_000);

      press('ArrowLeft');

      expect(result.current.currentMs).toBe(0);
    });

    it('closes on Escape', () => {
      open();
      press('Escape');

      expect(useAppStore.getState().replay).toBeNull();
    });
  });

  describe('onClose', () => {
    it('puts the video away', () => {
      const result = open();

      act(() => {
        result.current.onClose();
      });

      expect(useAppStore.getState().replay).toBeNull();
    });
  });

  describe('onLoaded', () => {
    it('frames the video in the shape it really has once it loads', () => {
      const result = open();

      expect(result.current.panelStyle).toMatchObject({
        '--video-ratio': String(1280 / 800),
      });

      result.current.videoRef.current = {
        videoWidth: 1768,
        videoHeight: 2208,
        currentTime: 0,
        play: () => Promise.resolve(),
      } as unknown as HTMLVideoElement;
      act(() => {
        result.current.onLoaded();
      });

      expect(result.current.panelStyle).toMatchObject({
        '--video-ratio': String(1768 / 2208),
      });
    });

    it("falls back to a screen's usual shape for a recording that never said its size", () => {
      const [workspace] = useWorkspaceStore.getState().workspaces;
      const [run] = workspace!.runs;

      useWorkspaceStore.setState({
        workspaces: [
          {
            ...workspace!,
            runs: [{ ...run!, video: { ...run!.video!, width: 0, height: 0 } }],
          },
        ],
      });

      expect(open().current.panelStyle).toMatchObject({ '--video-ratio': '1.6' });
    });
  });

  describe('network', () => {
    it('offers the network once the run kept its requests, out of sight until asked', async () => {
      withNetwork(NETWORK);

      const result = open();

      await waitFor(() => {
        expect(result.current.hasNetwork).toBe(true);
      });
      expect(result.current.isNetworkShown).toBe(false);
      expect(result.current.requests.map(({ fromMs }) => fromMs)).toEqual([
        1_000, 2_000, 6_000,
      ]);
    });

    it('does NOT offer it for a run that kept no requests', async () => {
      withNetwork(null);

      const result = open();

      await waitFor(() => {
        expect(result.current.url).toBe(URL);
      });
      expect(result.current.hasNetwork).toBe(false);
      expect(result.current.isNetworkShown).toBe(false);
    });

    it('shows it under the video once switched on, and remembers it for the next run', async () => {
      withNetwork(NETWORK);

      const result = open();

      await waitFor(() => {
        expect(result.current.hasNetwork).toBe(true);
      });
      act(() => {
        result.current.onToggleNetwork(true);
      });

      expect(result.current.isNetworkShown).toBe(true);
      expect(useSettingsStore.getState().replayNetwork).toBe(true);
    });

    it('marks on the timeline where a failed request came back, the files left out', async () => {
      useSettingsStore.setState({ replayNetwork: true });
      withNetwork(NETWORK);

      const result = open();

      await waitFor(() => {
        expect(result.current.faults).toEqual([6_300]);
      });
    });

    it('marks a failed file too, once the QA shows the files', async () => {
      useSettingsStore.setState({ replayNetwork: true });
      withNetwork(NETWORK);

      const result = open();

      await waitFor(() => {
        expect(result.current.hasNetwork).toBe(true);
      });
      act(() => {
        result.current.onToggleAll();
      });

      expect(result.current.isShowingAll).toBe(true);
      expect(result.current.faults).toEqual([2_120, 6_300]);
    });

    it('marks nothing while the network is switched off', async () => {
      withNetwork(NETWORK);

      const result = open();

      await waitFor(() => {
        expect(result.current.hasNetwork).toBe(true);
      });
      expect(result.current.faults).toEqual([]);
    });
  });

  describe('onSave', () => {
    it('saves the video as it was recorded while the network is out of sight', async () => {
      const saveReplay = vi.fn(() => Promise.resolve('saved' as const));
      const replayVideo = vi.fn(() => Promise.resolve(null));

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        replayUrl: () => Promise.resolve(URL),
        runNetwork: () => Promise.resolve(NETWORK),
        saveReplay,
        replayVideo,
      };

      const result = open();

      await waitFor(() => {
        expect(result.current.canSave).toBe(true);
      });
      act(() => {
        result.current.onSave();
      });

      await waitFor(() => {
        expect(result.current.saveLabel).toBe('Saved');
      });
      expect(saveReplay).toHaveBeenCalledWith({
        workspaceId: 'w1',
        runId: 'r-01',
        name: 'Checkout regression r-01',
      });
      expect(replayVideo).not.toHaveBeenCalled();
    });

    it('prepares the video with its network first once the network shows', async () => {
      useSettingsStore.setState({ replayNetwork: true });

      const replayVideo = vi.fn(() => new Promise<Uint8Array | null>(() => undefined));

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        replayUrl: () => Promise.resolve(URL),
        runNetwork: () => Promise.resolve(NETWORK),
        replayVideo,
      };

      const result = open();

      await waitFor(() => {
        expect(result.current.isNetworkShown).toBe(true);
      });
      act(() => {
        result.current.onSave();
      });

      expect(result.current).toMatchObject({
        isPreparing: true,
        preparingLabel: 'Preparing the video',
        preparedPercent: 0,
      });
      expect(replayVideo).toHaveBeenCalledWith({ workspaceId: 'w1', runId: 'r-01' });
    });

    it('says it could not save a video it cannot read, and never asks where to save it', async () => {
      useSettingsStore.setState({ replayNetwork: true });

      const saveVideo = vi.fn(() => Promise.resolve('saved' as const));

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        replayUrl: () => Promise.resolve(URL),
        runNetwork: () => Promise.resolve(NETWORK),
        replayVideo: () => Promise.resolve(new Uint8Array([1, 2, 3])),
        saveVideo,
      };

      const result = open();

      await waitFor(() => {
        expect(result.current.isNetworkShown).toBe(true);
      });
      act(() => {
        result.current.onSave();
      });

      await waitFor(() => {
        expect(result.current.saveLabel).toBe('Could not save');
      });
      expect(result.current.isPreparing).toBe(false);
      expect(saveVideo).not.toHaveBeenCalled();
    });

    it('says it could not save when the run kept no video to draw on', async () => {
      useSettingsStore.setState({ replayNetwork: true });
      withNetwork(NETWORK);

      const result = open();

      await waitFor(() => {
        expect(result.current.isNetworkShown).toBe(true);
      });
      act(() => {
        result.current.onSave();
      });

      await waitFor(() => {
        expect(result.current.saveLabel).toBe('Could not save');
      });
    });
  });
});
