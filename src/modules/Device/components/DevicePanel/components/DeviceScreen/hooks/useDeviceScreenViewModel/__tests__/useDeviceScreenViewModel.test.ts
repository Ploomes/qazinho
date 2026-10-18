// @vitest-environment jsdom
import type { IDeviceScreenProps } from '@/modules/Device/components/DevicePanel/components/DeviceScreen/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDeviceScreenViewModel } from '@/modules/Device/components/DevicePanel/components/DeviceScreen/hooks/useDeviceScreenViewModel';

const screen = (props: Partial<IDeviceScreenProps>) =>
  renderHook(() =>
    useDeviceScreenViewModel({
      shot: null,
      stream: null,
      ratio: 1280 / 800,
      ...props,
    }),
  ).result.current;

describe('useDeviceScreenViewModel', () => {
  /**
   * Chrome keeps a window at least 500 pixels wide, so a 390-pixel page streams framed 500 wide:
   * the stream is cut to the page's shape, from its top left corner.
   */
  it('shapes the live stream like the page, so a frame wider than the page is cut to it', () => {
    const streaming = screen({
      stream: 'http://127.0.0.1:5000/token/w1',
      ratio: 390 / 844,
    });

    expect(streaming.className).toBe('device-screen device-screen--streaming');
    expect(streaming.style).toEqual({ '--screen-ratio': String(390 / 844) });
  });

  it('does NOT cut a screenshot, which already is the page', () => {
    expect(screen({ shot: 'data:image/jpeg;base64,shot' }).className).toBe(
      'device-screen',
    );
  });
});
