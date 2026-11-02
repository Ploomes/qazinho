// @vitest-environment jsdom
import type { ITargetCardProps } from '@/modules/Project/components/ProjectModal/components/TargetCard/types';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTargetCardViewModel } from '@/modules/Project/components/ProjectModal/components/TargetCard/hooks/useTargetCardViewModel';

const SET_UP = {
  label: 'Set up Android',
  guide: 'Install Android Studio.',
  link: { label: 'Android Studio', url: 'https://developer.android.com/studio' },
};

const card = (lock: ITargetCardProps['lock']) =>
  renderHook((props: ITargetCardProps) => useTargetCardViewModel(props), {
    initialProps: { name: 'Android', text: '', lock, children: null },
  });

describe('useTargetCardViewModel', () => {
  it('leaves an unlocked target alone', () => {
    expect(card(null).result.current).toMatchObject({
      isLocked: false,
      isGuiding: false,
      className: 'target-card',
      bodyClassName: 'target-card__body',
    });
  });

  it('marks a target this machine cannot reach yet as locked', () => {
    expect(
      card({ reason: 'Needs the Android SDK', setUp: SET_UP }).result.current.className,
    ).toBe('target-card target-card--locked');
  });

  it('puts the field under the name when stacked', () => {
    const { result } = renderHook(() =>
      useTargetCardViewModel({
        name: 'Repositories',
        lock: null,
        isStacked: true,
        children: null,
      }),
    );

    expect(result.current.bodyClassName).toBe(
      'target-card__body target-card__body--stacked',
    );
  });

  it('opens the set-up guide when asked, and closes it again', () => {
    const { result } = card({ reason: 'Needs the Android SDK', setUp: SET_UP });

    expect(result.current).toMatchObject({ isLocked: true, isGuiding: false });

    act(() => {
      result.current.onSetUp();
    });

    expect(result.current.isGuiding).toBe(true);

    act(() => {
      result.current.onBack();
    });

    expect(result.current.isGuiding).toBe(false);
  });

  it('never shows a guide for a lock with nothing to set up', () => {
    const { result } = card({ reason: 'Testing iOS needs a Mac', setUp: null });

    act(() => {
      result.current.onSetUp();
    });

    expect(result.current.isGuiding).toBe(false);
  });

  it('does the one thing a lock asks for, with no guide to read first', () => {
    const onSetUp = vi.fn();
    const { result } = card({
      reason: 'Connect GitHub to pick repositories',
      setUp: { label: 'Connect GitHub', onSetUp },
    });

    act(() => {
      result.current.onSetUp();
    });

    expect(onSetUp).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ isGuiding: false, guide: null });
  });

  it('lets go of the guide once the tools are found', () => {
    const { result, rerender } = card({ reason: 'Needs the Android SDK', setUp: SET_UP });

    act(() => {
      result.current.onSetUp();
    });
    rerender({ name: 'Android', text: '', lock: null, children: null });

    expect(result.current).toMatchObject({ isLocked: false, isGuiding: false });
  });
});
