// @vitest-environment jsdom
import type { ReplayFocus } from '@/modules/Run/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRunReplayViewModel } from '@/modules/Run/components/RunReplay/hooks/useRunReplayViewModel';
import { recordedRun, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const URL = 'http://127.0.0.1:4000/t0k/w1/r-01';

function open(focus: ReplayFocus = { kind: 'run' }) {
  useAppStore.setState({ replay: { workspaceId: 'w1', runId: 'r-01', focus } });

  return renderHook(() => useRunReplayViewModel()).result;
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
});
