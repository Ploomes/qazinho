// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLightboxViewModel } from '@/components/organisms/Lightbox/hooks/useLightboxViewModel';
import { useAppStore } from '@/store';

const SHOT = {
  kicker: 'run r-01',
  title: 'the step that broke',
  isTall: false,
  src: null,
};

beforeEach(() => {
  useAppStore.setState({ media: SHOT });
});

describe('useLightboxViewModel', () => {
  it('shows what was opened', () => {
    const { result } = renderHook(() => useLightboxViewModel());

    expect(result.current.media?.title).toBe('the step that broke');
  });

  it('frames a phone narrower than a browser', () => {
    const wide = renderHook(() => useLightboxViewModel());

    expect(wide.result.current.frameWidth).toBe(560);

    useAppStore.setState({ media: { ...SHOT, isTall: true, src: null } });

    const tall = renderHook(() => useLightboxViewModel());

    expect(tall.result.current.frameWidth).toBe(320);
  });

  it('closes on Escape', () => {
    renderHook(() => useLightboxViewModel());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(useAppStore.getState().media).toBeNull();
  });
});
