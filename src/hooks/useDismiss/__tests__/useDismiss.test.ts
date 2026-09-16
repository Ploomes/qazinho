// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDismiss } from '@/hooks/useDismiss';

function mount(onDismiss: () => void) {
  const popover = document.createElement('div');
  const inside = document.createElement('button');
  const trigger = document.createElement('button');
  const elsewhere = document.createElement('div');

  trigger.setAttribute('aria-haspopup', 'menu');
  popover.append(inside);
  document.body.append(popover, trigger, elsewhere);

  const hook = renderHook(() => {
    const ref = useDismiss<HTMLDivElement>(onDismiss);
    ref.current = popover;
    return ref;
  });

  return { hook, inside, trigger, elsewhere };
}

function press(target: Element) {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('useDismiss', () => {
  it('closes on a press outside the popover', () => {
    const onDismiss = vi.fn();
    const { elsewhere } = mount(onDismiss);

    press(elsewhere);

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('closes on Escape', () => {
    const onDismiss = vi.fn();
    mount(onDismiss);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does NOT close on a press inside the popover', () => {
    const onDismiss = vi.fn();
    const { inside } = mount(onDismiss);

    press(inside);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('leaves a trigger to toggle on its own click, so it does not reopen at once', () => {
    const onDismiss = vi.fn();
    const { trigger } = mount(onDismiss);

    press(trigger);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('stops listening once the popover is gone', () => {
    const onDismiss = vi.fn();
    const { hook, elsewhere } = mount(onDismiss);

    hook.unmount();
    press(elsewhere);

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
