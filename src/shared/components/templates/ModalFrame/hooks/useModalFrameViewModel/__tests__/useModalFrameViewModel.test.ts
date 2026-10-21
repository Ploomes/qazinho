// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useModalFrameViewModel } from '@/shared/components/templates/ModalFrame/hooks/useModalFrameViewModel';

const PROPS = {
  title: 'New project',
  subtitle: 'One environment of the app you test.',
  width: 740,
  confirmLabel: 'Create project',
  canConfirm: true,
  children: null,
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
};

function pressEscape() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
}

describe('useModalFrameViewModel', () => {
  it('confirms when it is allowed to', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() => useModalFrameViewModel({ ...PROPS, onConfirm }));

    result.current.onConfirmClick();

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('does NOT confirm a form that is not ready', () => {
    const onConfirm = vi.fn();
    const { result } = renderHook(() =>
      useModalFrameViewModel({ ...PROPS, canConfirm: false, onConfirm }),
    );

    result.current.onConfirmClick();

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('lays the body out alone when it has no nav', () => {
    const { result } = renderHook(() => useModalFrameViewModel(PROPS));

    expect(result.current.isBeside).toBe(false);
    expect(result.current.panelStyle).toMatchObject({ width: 740, height: undefined });
  });

  it('puts the body beside a nav, at the height asked for, so its sections do not jump', () => {
    const { result } = renderHook(() =>
      useModalFrameViewModel({ ...PROPS, nav: 'sections', height: 640 }),
    );

    expect(result.current.isBeside).toBe(true);
    expect(result.current.panelStyle).toMatchObject({
      width: 740,
      height: 640,
      '--modal-nav-width': '184px',
    });
  });

  it('closes on Escape, the way every modal in the app does', () => {
    const onCancel = vi.fn();
    renderHook(() => useModalFrameViewModel({ ...PROPS, onCancel }));

    pressEscape();

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('stops listening once it is gone', () => {
    const onCancel = vi.fn();
    const { unmount } = renderHook(() => useModalFrameViewModel({ ...PROPS, onCancel }));

    unmount();
    pressEscape();

    expect(onCancel).not.toHaveBeenCalled();
  });
});
