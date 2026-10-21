// @vitest-environment jsdom
import type { IReplayMoment } from '@/modules/Run/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReplayLogViewModel } from '@/modules/Run/components/RunReplay/components/ReplayLog/hooks/useReplayLogViewModel';
import { replayTimelineOf } from '@/modules/Run/library';
import { recordedRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = recordedRun();
const TIMELINE = replayTimelineOf({ run: WORKSPACE.runs[0]!, bugs: WORKSPACE.bugs })!;

function render(moment: IReplayMoment) {
  const onSeek = vi.fn();
  const { result } = renderHook(() =>
    useReplayLogViewModel({ timeline: TIMELINE, moment, onSeek }),
  );

  return { onSeek, result };
}

describe('useReplayLogViewModel', () => {
  it('counts the cases of the run', () => {
    expect(
      render({ chapterIndex: 0, stepIndex: 0, isBetween: false }).result.current.eyebrow,
    ).toBe('2 cases');
  });

  it('opens the case playing and lights the step it is on', () => {
    const { result } = render({ chapterIndex: 1, stepIndex: 1, isBetween: false });
    const [first, second] = result.current.chapters;

    expect(first?.isOpen).toBe(false);
    expect(second?.isOpen).toBe(true);
    expect(second?.steps.map(({ isNow }) => isNow)).toEqual([false, true, false]);
  });

  it('does NOT light a step while the app opens anew after a case', () => {
    const { result } = render({ chapterIndex: 0, stepIndex: 2, isBetween: true });

    expect(result.current.chapters[0]?.steps.some(({ isNow }) => isNow)).toBe(false);
  });

  it('lists the bug a step became, and jumps to a little before it', () => {
    const { onSeek, result } = render({
      chapterIndex: 1,
      stepIndex: 0,
      isBetween: false,
    });
    const [bug] = result.current.chapters[1]?.steps[1]?.bugs ?? [];

    expect(bug).toMatchObject({ id: 'BUG-01', title: 'Nothing happens on submit' });

    bug?.onClick();

    expect(onSeek).toHaveBeenCalledWith(5_500);
  });

  it('jumps to a case or to a step on a click', () => {
    const { onSeek, result } = render({
      chapterIndex: 0,
      stepIndex: 0,
      isBetween: false,
    });

    result.current.chapters[1]?.onClick();

    expect(onSeek).toHaveBeenLastCalledWith(5_500);

    result.current.chapters[0]?.steps[2]?.onClick();

    expect(onSeek).toHaveBeenLastCalledWith(3_500);
  });

  it('says how long each case took in the video', () => {
    const { result } = render({ chapterIndex: 0, stepIndex: 0, isBetween: false });

    expect(result.current.chapters.map(({ duration }) => duration)).toEqual([
      '0:05',
      '0:06',
    ]);
  });
});
