// @vitest-environment jsdom
import type { IMenuButtonItem } from '@/shared/components/molecules/MenuButton/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMenuButtonViewModel } from '@/shared/components/molecules/MenuButton/hooks/useMenuButtonViewModel';

const view = (items: IMenuButtonItem[]) =>
  renderHook(() =>
    useMenuButtonViewModel({ label: 'Exportar', icon: 'download', items }),
  );

afterEach(() => {
  cleanup();
});

describe('useMenuButtonViewModel', () => {
  it('opens on the click and closes on the next', () => {
    const { result } = view([]);

    act(() => {
      result.current.onToggle();
    });

    expect(result.current).toMatchObject({
      isOpen: true,
      caretClassName: 'menu-button__caret menu-button__caret--open',
    });

    act(() => {
      result.current.onToggle();
    });

    expect(result.current).toMatchObject({
      isOpen: false,
      caretClassName: 'menu-button__caret',
    });
  });

  it('does what the picked choice says, and closes', () => {
    const onPick = vi.fn();
    const { result } = view([
      { key: 'code', label: 'Código de teste', icon: 'download', onPick },
    ]);

    act(() => {
      result.current.onToggle();
    });
    act(() => {
      result.current.items[0]?.onPick();
    });

    expect(onPick).toHaveBeenCalledOnce();
    expect(result.current.isOpen).toBe(false);
  });

  it('does NOT do a choice that is off, and stays open', () => {
    const onPick = vi.fn();
    const { result } = view([
      {
        key: 'publish',
        label: 'Publicando…',
        icon: 'up',
        isDisabled: true,
        tip: 'Publica o plano numa página.',
        onPick,
      },
    ]);

    act(() => {
      result.current.onToggle();
    });
    act(() => {
      result.current.items[0]?.onPick();
    });

    expect(onPick).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.items[0]).toMatchObject({
      isDisabled: true,
      tip: 'Publica o plano numa página.',
    });
  });

  it('closes on Escape', () => {
    const { result } = view([]);

    act(() => {
      result.current.onToggle();
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.isOpen).toBe(false);
  });
});
