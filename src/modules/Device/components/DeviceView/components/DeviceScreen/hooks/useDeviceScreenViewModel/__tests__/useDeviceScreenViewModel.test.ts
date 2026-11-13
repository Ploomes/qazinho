// @vitest-environment jsdom
import type { IDeviceScreenProps } from '@/modules/Device/components/DeviceView/components/DeviceScreen/types';
import type { DeviceInput } from '@/shared/types';
import type { KeyboardEvent, PointerEvent, SyntheticEvent, WheelEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/** Uma tela de 400 por 800 no canto da janela, que é onde o QA toca. */
const surface = {
  focus: vi.fn(),
  setPointerCapture: vi.fn(),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 800 }),
};

const pointer = (clientX: number, clientY: number) =>
  ({
    currentTarget: surface,
    clientX,
    clientY,
    pointerId: 1,
  }) as unknown as PointerEvent<HTMLDivElement>;

const key = (pressed: string, more: Partial<KeyboardEvent> = {}) => {
  const event = {
    key: pressed,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    ...more,
  };

  return event as unknown as KeyboardEvent<HTMLDivElement> & {
    preventDefault: ReturnType<typeof vi.fn>;
  };
};

/** A tela de quem toca, e o que chegou ao dispositivo. */
function touching() {
  const sent: DeviceInput[] = [];
  const { result } = renderHook(() =>
    useDeviceScreenViewModel({
      shot: null,
      stream: 'http://127.0.0.1:5000/token/w1',
      ratio: 9 / 19.5,
      fitsWhole: true,
      onTouch: (input) => {
        sent.push(input);
      },
    }),
  );

  return { result, sent };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

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
    expect(streaming.surfaceStream).toBeNull();
  });

  it('does NOT cut a screenshot, which already is the page', () => {
    expect(screen({ shot: 'data:image/jpeg;base64,shot' }).className).toBe(
      'device-screen',
    );
  });

  describe('the QA driving the device by hand', () => {
    it('shapes a phone like the frames it sends, not like a guess', () => {
      const { result } = touching();

      expect(result.current.surfaceStream).toBe('http://127.0.0.1:5000/token/w1');

      act(() => {
        result.current.onStreamLoad({
          currentTarget: { naturalWidth: 1080, naturalHeight: 2400 },
        } as unknown as SyntheticEvent<HTMLImageElement>);
      });

      expect(result.current.style).toEqual({ '--screen-ratio': String(1080 / 2400) });
    });

    it('taps where the QA clicked, and drags when they moved', () => {
      const { result, sent } = touching();

      act(() => {
        result.current.onPointerDown(pointer(100, 200));
        result.current.onPointerUp(pointer(102, 201));
        result.current.onPointerDown(pointer(200, 700));
        result.current.onPointerUp(pointer(200, 100));
      });

      expect(sent).toEqual([
        { kind: 'tap', x: 0.25, y: 0.25 },
        { kind: 'drag', x: 0.5, y: 0.875, toX: 0.5, toY: 0.125 },
      ]);
      expect(surface.focus).toHaveBeenCalled();
    });

    it('sends a scroll once the wheel settles, as one gesture', () => {
      const { result, sent } = touching();

      act(() => {
        for (const deltaY of [40, 40, 80])
          result.current.onWheel({
            currentTarget: surface,
            clientX: 200,
            clientY: 400,
            deltaX: 0,
            deltaY,
          } as unknown as WheelEvent<HTMLDivElement>);
      });

      expect(sent).toEqual([]);

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(sent).toEqual([{ kind: 'scroll', x: 0.5, y: 0.5, dx: 0, dy: 0.2 }]);
    });

    it('types what the QA writes in one go, and presses the keys that do not type', () => {
      const { result, sent } = touching();
      const enter = key('Enter');

      act(() => {
        for (const letter of ['q', 'a', ' ', 'ç']) result.current.onKeyDown(key(letter));
        result.current.onKeyDown(enter);
      });

      expect(sent).toEqual([
        { kind: 'type', text: 'qa ç' },
        { kind: 'key', key: 'Enter' },
      ]);
      expect(enter.preventDefault).toHaveBeenCalled();
    });

    it('does NOT send a shortcut of the app, nor a key that types nothing', () => {
      const { result, sent } = touching();

      act(() => {
        result.current.onKeyDown(key('b', { metaKey: true }));
        result.current.onKeyDown(key('Shift'));
        result.current.onKeyDown(key('Dead'));
        vi.advanceTimersByTime(500);
      });

      expect(sent).toEqual([]);
    });
  });
});
