// @vitest-environment jsdom
import type { IDeviceScreenProps } from '@/modules/Device/components/DeviceView/components/DeviceScreen/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDeviceScreenViewModel } from '@/modules/Device/components/DeviceView/components/DeviceScreen/hooks/useDeviceScreenViewModel';

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
   * O Chrome mantém uma janela com pelo menos 500 pixels de largura, então uma página de
   * 390 pixels transmite enquadrada em 500: o stream é cortado no formato da página, a
   * partir do canto superior esquerdo.
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
