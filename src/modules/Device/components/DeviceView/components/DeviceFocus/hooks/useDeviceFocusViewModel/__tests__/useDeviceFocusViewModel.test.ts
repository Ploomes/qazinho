// @vitest-environment jsdom
import type { IDeviceFocusProps } from '@/modules/Device/components/DeviceView/components/DeviceFocus/types';
import type { IDeviceStep } from '@/modules/Device/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDeviceFocusViewModel } from '@/modules/Device/components/DeviceView/components/DeviceFocus/hooks/useDeviceFocusViewModel';

const step = (number: number, verdict: IDeviceStep['verdict']): IDeviceStep => ({
  number,
  action: `Step ${String(number)}`,
  verdict,
});

const focus = (props: Partial<IDeviceFocusProps>) =>
  renderHook(() =>
    useDeviceFocusViewModel({
      isPhone: false,
      shot: null,
      stream: null,
      isLive: true,
      elapsedLabel: '',
      urlText: '',
      stateText: '',
      mood: 'running',
      steps: [],
      doingLabel: '',
      stepsWord: 'steps',
      hasControls: true,
      pauseLabel: 'Pause',
      viewports: [],
      ratio: 1.6,
      onSelectViewport: vi.fn(),
      onPause: vi.fn(),
      onStop: vi.fn(),
      onClose: vi.fn(),
      ...props,
    }),
  ).result.current;

describe('useDeviceFocusViewModel', () => {
  it('puts the step the agent is on up front, and lists only what it reached', () => {
    const view = focus({
      steps: [step(1, 'passed'), step(2, 'running'), step(3, 'pending')],
    });

    expect(view).toMatchObject({ nowEyebrow: 'now', now: 'Step 2', nowNumber: 2 });
    expect(view.rows.map(({ number, isCurrent }) => [number, isCurrent])).toEqual([
      [1, false],
      [2, true],
    ]);
  });

  it('shows the next step between two, while nothing is running', () => {
    expect(focus({ steps: [step(1, 'passed'), step(2, 'pending')] })).toMatchObject({
      nowEyebrow: 'next',
      now: 'Step 2',
    });
  });

  it('says every step is done once none is left', () => {
    expect(focus({ steps: [step(1, 'passed'), step(2, 'failed')] })).toMatchObject({
      now: 'Every step is done.',
      nowNumber: null,
    });
  });

  it('shapes the screen to the window size the run drives', () => {
    expect(focus({ ratio: 390 / 844 }).style).toMatchObject({
      '--focus-ratio': String(390 / 844),
    });
  });

  it('leaves on Escape, and on no other key', () => {
    const onClose = vi.fn();

    focus({ onClose });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(onClose).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('offers the window sizes beside a browser, and none beside a phone', () => {
    expect(
      focus({
        viewports: [
          { id: 'desktop', label: 'Desktop', size: '1280 × 800', isActive: true },
        ],
      }).hasViewports,
    ).toBe(true);
    expect(focus({ isPhone: true, viewports: [] }).hasViewports).toBe(false);
  });
});
