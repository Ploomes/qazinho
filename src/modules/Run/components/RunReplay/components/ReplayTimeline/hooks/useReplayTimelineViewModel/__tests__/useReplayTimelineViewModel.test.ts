// @vitest-environment jsdom
import type { IReplayTimelineProps } from '@/modules/Run/components/RunReplay/components/ReplayTimeline/types';
import type { PointerEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { useReplayTimelineViewModel } from '@/modules/Run/components/RunReplay/components/ReplayTimeline/hooks/useReplayTimelineViewModel';
import { replayTimelineOf } from '@/modules/Run/library';
import { recordedRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = recordedRun();
const TIMELINE = replayTimelineOf({ run: WORKSPACE.runs[0]!, bugs: WORKSPACE.bugs })!;

function render(props: Partial<IReplayTimelineProps> = {}) {
  const onSeek = vi.fn();
  const onScrub = vi.fn();
  const view = renderHook(() =>
    useReplayTimelineViewModel({
      timeline: TIMELINE,
      progress: motionValue(0),
      currentMs: 0,
      take: null,
      flashBugId: null,
      url: 'http://127.0.0.1:4000/t0k/w1/r-01',
      onSeek,
      onScrub,
      ...props,
    }),
  );

  return { onSeek, onScrub, result: view.result };
}

/** A pointer over a 1000px-wide rail, `x` pixels in from its left. */
function pointer(x: number) {
  return {
    clientX: x,
    pointerId: 1,
    currentTarget: {
      getBoundingClientRect: () => ({ left: 0, width: 1_000 }),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    },
  } as unknown as PointerEvent<HTMLDivElement>;
}

describe('useReplayTimelineViewModel', () => {
  it("lays each case on the rail where it ran, in its verdict's colour", () => {
    const { result } = render();
    const [first, second] = result.current.chapters;

    expect(first?.style).toMatchObject({ '--from': '0%' });
    expect(first?.className).toContain('replay-timeline__chapter--pass');
    expect(second?.style).toMatchObject({
      '--from': `${String((5_500 / 12_000) * 100)}%`,
    });
    expect(second?.className).toContain('replay-timeline__chapter--fail');
  });

  it('notches each step after the first inside its case', () => {
    const { result } = render();

    expect(result.current.chapters[0]?.ticks.map(({ style }) => style)).toEqual([
      { '--at': `${String((1_500 / 5_500) * 100)}%` },
      { '--at': `${String((3_500 / 5_500) * 100)}%` },
    ]);
  });

  it('brackets a take and dims the cases outside it', () => {
    const { result } = render({ take: { fromMs: 5_500, toMs: 11_500 } });

    expect(result.current.take?.style).toMatchObject({
      '--from': `${String((5_500 / 12_000) * 100)}%`,
    });
    expect(result.current.chapters[0]?.className).toContain('--outside');
    expect(result.current.chapters[1]?.className).not.toContain('--outside');
  });

  it('pins each bug where it was caught, and jumps to a little before it on a click', () => {
    const { onSeek, result } = render();
    const [pin] = result.current.pins;

    expect(pin?.style).toEqual({ '--at': `${String((9_500 / 12_000) * 100)}%` });

    pin?.onClick();

    expect(onSeek).toHaveBeenCalledWith(5_500);
  });

  it('calls out the bug the video just reached', () => {
    const { result } = render({ flashBugId: 'BUG-01' });

    expect(result.current.pins[0]).toMatchObject({
      isFlashing: true,
      callout: 'BUG-01 caught here',
      calloutClassName: 'replay-timeline__callout',
    });
    expect(render().result.current.pins[0]?.isFlashing).toBe(false);
  });

  /** A call centred on a pin near an end of the rail would be cut off by the panel. */
  it('keeps the call inside the rail for a bug near either end', () => {
    const [mark] = TIMELINE.marks;
    const atEdges = {
      ...TIMELINE,
      marks: [
        { ...mark!, bugId: 'BUG-08', atMs: 400 },
        { ...mark!, bugId: 'BUG-09', atMs: 11_800 },
      ],
    };
    const { result } = render({ timeline: atEdges });

    expect(result.current.pins.map(({ calloutClassName }) => calloutClassName)).toEqual([
      'replay-timeline__callout replay-timeline__callout--start',
      'replay-timeline__callout replay-timeline__callout--end',
    ]);
  });

  describe('onPointerMove', () => {
    it('shows a still of the moment under the cursor, with its case and step', () => {
      const { result } = render();

      act(() => {
        result.current.onPointerMove(pointer(700));
      });

      expect(result.current.preview).toMatchObject({
        isShown: true,
        ms: 8_400,
        time: '0:08',
        chapter: 'TC-02 · Checkout with a test card',
        step: 'Step 2 · Leave the house number empty',
      });
    });

    it('does NOT seek while the pointer only hovers', () => {
      const { onSeek, result } = render();

      act(() => {
        result.current.onPointerMove(pointer(700));
      });

      expect(onSeek).not.toHaveBeenCalled();
    });
  });

  describe('onPointerLeave', () => {
    it('takes the still away', () => {
      const { result } = render();

      act(() => {
        result.current.onPointerMove(pointer(700));
      });
      act(() => {
        result.current.onPointerLeave();
      });

      expect(result.current.preview.isShown).toBe(false);
    });
  });

  describe('onPointerDown', () => {
    it('holds the video while dragged, seeking where the pointer goes, and lets it go on release', () => {
      const { onScrub, onSeek, result } = render();

      act(() => {
        result.current.onPointerDown(pointer(250));
      });

      expect(onScrub).toHaveBeenLastCalledWith(true);
      expect(onSeek).toHaveBeenLastCalledWith(3_000);

      act(() => {
        result.current.onPointerMove(pointer(500));
      });

      expect(onSeek).toHaveBeenLastCalledWith(6_000);

      act(() => {
        result.current.onPointerUp(pointer(500));
      });

      expect(onScrub).toHaveBeenLastCalledWith(false);
    });

    it('does NOT seek past the ends of the rail', () => {
      const { onSeek, result } = render();

      act(() => {
        result.current.onPointerDown(pointer(1_400));
      });

      expect(onSeek).toHaveBeenLastCalledWith(12_000);
    });
  });
});
