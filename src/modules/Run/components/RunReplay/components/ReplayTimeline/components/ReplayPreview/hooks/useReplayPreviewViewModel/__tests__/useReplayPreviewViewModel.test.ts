// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useReplayPreviewViewModel } from '@/modules/Run/components/RunReplay/components/ReplayTimeline/components/ReplayPreview/hooks/useReplayPreviewViewModel';

/** Um <video> que já leu os metadados, então pode buscar. */
function video() {
  return {
    readyState: HTMLMediaElement.HAVE_METADATA,
    currentTime: 0,
  } as HTMLVideoElement;
}

describe('useReplayPreviewViewModel', () => {
  it('has no still to show without a video', () => {
    const { result } = renderHook(() =>
      useReplayPreviewViewModel({ url: null, ms: null }),
    );

    expect(result.current.hasVideo).toBe(false);
  });

  it('turns its copy of the video to the moment under the cursor', () => {
    const view = renderHook((props) => useReplayPreviewViewModel(props), {
      initialProps: { url: 'http://127.0.0.1:4000/t/w1/r-01', ms: null as number | null },
    });
    const element = video();

    view.result.current.videoRef.current = element;
    view.rerender({ url: 'http://127.0.0.1:4000/t/w1/r-01', ms: 4_200 });

    expect(element.currentTime).toBe(4.2);
  });

  /**
   * Buscar num vídeo leva um momento; pedir de novo enquanto isso empilharia buscas atrás
   * de um cursor rápido.
   */
  it('holds a moment asked mid-seek, and goes there once the seek lands', () => {
    const view = renderHook((props) => useReplayPreviewViewModel(props), {
      initialProps: { url: 'http://127.0.0.1:4000/t/w1/r-01', ms: null as number | null },
    });
    const element = video();

    view.result.current.videoRef.current = element;
    view.rerender({ url: 'http://127.0.0.1:4000/t/w1/r-01', ms: 1_000 });
    view.rerender({ url: 'http://127.0.0.1:4000/t/w1/r-01', ms: 2_000 });

    expect(element.currentTime).toBe(1);

    act(() => {
      view.result.current.onSeeked();
    });

    expect(element.currentTime).toBe(2);
  });
});
