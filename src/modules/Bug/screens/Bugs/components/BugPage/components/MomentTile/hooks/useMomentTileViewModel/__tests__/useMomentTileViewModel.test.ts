// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useMomentTileViewModel } from '@/modules/Bug/screens/Bugs/components/BugPage/components/MomentTile/hooks/useMomentTileViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore } from '@/store';

const URL = 'http://127.0.0.1:4000/t0k/w1/r-01';
const PROPS = {
  bugId: 'BUG-01',
  moment: { workspaceId: 'w1', runId: 'r-01', atMs: 9_500 },
};

function serving(url: string | null) {
  window.qazinho = { ...fakeQazinhoApi('darwin'), replayUrl: () => Promise.resolve(url) };
}

afterEach(() => {
  useAppStore.setState({ replay: null });
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useMomentTileViewModel', () => {
  it("asks main where the run's video is, to show a frame of it", async () => {
    serving(URL);

    const { result } = renderHook(() => useMomentTileViewModel(PROPS));

    expect(result.current.label).toBe('Watch the moment');
    await waitFor(() => {
      expect(result.current.src).toBe(URL);
    });
    expect(result.current.hasVideo).toBe(true);
  });

  it('shows no frame when the run has no video on disk', async () => {
    serving(null);

    const { result } = renderHook(() => useMomentTileViewModel(PROPS));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasVideo).toBe(false);
  });

  describe('onLoadedMetadata', () => {
    it('stops the frame at the moment the bug was caught', () => {
      serving(URL);

      const { result } = renderHook(() => useMomentTileViewModel(PROPS));
      const video = { currentTime: 0 } as HTMLVideoElement;

      result.current.videoRef.current = video;
      result.current.onLoadedMetadata();

      expect(video.currentTime).toBe(9.5);
    });
  });

  describe('onOpen', () => {
    it("plays the bug's take", () => {
      serving(URL);

      const { result } = renderHook(() => useMomentTileViewModel(PROPS));

      act(() => {
        result.current.onOpen();
      });

      expect(useAppStore.getState().replay).toEqual({
        workspaceId: 'w1',
        runId: 'r-01',
        focus: { kind: 'bug', bugId: 'BUG-01' },
      });
    });
  });
});
