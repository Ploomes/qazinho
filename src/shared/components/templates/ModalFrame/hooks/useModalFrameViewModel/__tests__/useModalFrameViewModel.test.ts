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

  describe('onPanelKeyDown', () => {
    /** A panel with a field and two buttons, and the key event React would hand the view model. */
    function panelWith() {
      const panel = document.createElement('div');

      panel.innerHTML =
        '<input id="name"><button id="cancel">Cancel</button><button id="create">Create</button>';
      document.body.append(panel);

      const key = (props: { key: string; on: string; shiftKey?: boolean }) => {
        const target = panel.querySelector<HTMLElement>(`#${props.on}`);

        target?.focus();

        const event = {
          key: props.key,
          shiftKey: props.shiftKey ?? false,
          altKey: false,
          ctrlKey: false,
          metaKey: false,
          defaultPrevented: false,
          target,
          currentTarget: panel,
          preventDefault: vi.fn(),
        };

        return event as unknown as Parameters<
          ReturnType<typeof useModalFrameViewModel>['onPanelKeyDown']
        >[0];
      };

      return { panel, key };
    }

    it('confirms on Enter in a field, when the form is ready', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useModalFrameViewModel({ ...PROPS, onConfirm }),
      );
      const { key, panel } = panelWith();

      result.current.onPanelKeyDown(key({ key: 'Enter', on: 'name' }));

      expect(onConfirm).toHaveBeenCalledOnce();
      panel.remove();
    });

    it('does NOT confirm on Enter while the form is not ready', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useModalFrameViewModel({ ...PROPS, canConfirm: false, onConfirm }),
      );
      const { key, panel } = panelWith();

      result.current.onPanelKeyDown(key({ key: 'Enter', on: 'name' }));

      expect(onConfirm).not.toHaveBeenCalled();
      panel.remove();
    });

    /** Tab used to walk out of the modal into the sidebar and the titlebar behind it. */
    it('keeps Tab inside the modal, round from the last control to the first', () => {
      const { result } = renderHook(() => useModalFrameViewModel(PROPS));
      const { key, panel } = panelWith();

      result.current.onPanelKeyDown(key({ key: 'Tab', on: 'create' }));

      expect(document.activeElement?.id).toBe('name');

      result.current.onPanelKeyDown(key({ key: 'Tab', on: 'name', shiftKey: true }));

      expect(document.activeElement?.id).toBe('create');
      panel.remove();
    });
  });
});
