// @vitest-environment jsdom
import type { IReplayRequest } from '@/modules/Run/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRequestDetailViewModel } from '@/modules/Run/components/RunReplay/components/RequestDetail/hooks/useRequestDetailViewModel';
import { NETWORK } from '@/modules/Run/constants';

const request = (props: Partial<IReplayRequest>): IReplayRequest => ({
  id: 7,
  method: 'POST',
  url: 'https://shop.test/api/cart?coupon=${COUPON}',
  host: null,
  path: '/api/cart',
  type: 'fetch',
  isApi: true,
  outcome: 'ok',
  status: 200,
  failure: null,
  fromMs: 4_000,
  toMs: 4_180,
  durationMs: 180,
  size: 2_048,
  body: null,
  ...props,
});

function render(over: Partial<IReplayRequest> = {}) {
  const onSeek = vi.fn();
  const onClose = vi.fn();
  const { result } = renderHook(() =>
    useRequestDetailViewModel({ request: request(over), onSeek, onClose }),
  );

  return { result, onSeek, onClose };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useRequestDetailViewModel', () => {
  describe('what it shows', () => {
    it('names the request by its method and path, with the whole address apart', () => {
      const { result } = render();

      expect(result.current).toMatchObject({
        method: 'POST',
        path: '/api/cart',
        url: 'https://shop.test/api/cart?coupon=${COUPON}',
        statusText: '200',
        statusClassName: 'request-detail__status request-detail__status--pass',
      });
    });

    it('lists the type, the moment in the video, how long it took and its size', () => {
      expect(render().result.current.facts.map(({ id, value }) => [id, value])).toEqual([
        ['type', 'fetch'],
        ['at', '0:04.0'],
        ['took', expect.any(String)],
        ['size', expect.any(String)],
      ]);
    });

    it('says a request that never ended got no answer, and leaves out a size it never had', () => {
      const { result } = render({
        durationMs: null,
        toMs: null,
        size: null,
        status: null,
      });

      expect(result.current.statusText).toBe('No answer');
      expect(result.current.statusClassName).toContain('--pending');
      expect(result.current.facts.map(({ id }) => id)).toEqual(['type', 'at', 'took']);
      expect(result.current.facts[2]?.value).toBe('No answer');
    });

    it('shows the network error of a request that failed', () => {
      const { result } = render({
        outcome: 'failed',
        status: null,
        failure: 'net::ERR_CONNECTION_REFUSED',
      });

      expect(result.current).toMatchObject({
        statusText: 'failed',
        hasFailure: true,
        failure: 'net::ERR_CONNECTION_REFUSED',
      });
    });

    /** Só a resposta de uma chamada que falhou é guardada; o resto diz isso em vez de sumir. */
    it('shows what a failed call answered, and says why another shows none', () => {
      const failed = render({
        outcome: 'server',
        status: 500,
        body: '{"error":"empty"}',
      });
      const kept = render();

      expect(failed.result.current).toMatchObject({
        hasBody: true,
        body: '{"error":"empty"}',
        hasNote: false,
      });
      expect(kept.result.current).toMatchObject({ hasBody: false, hasNote: true });
    });
  });

  describe('onSee', () => {
    it('takes the video to a little before the request and closes the detail', () => {
      const { result, onSeek, onClose } = render();

      result.current.onSee();

      expect(onSeek).toHaveBeenCalledExactlyOnceWith(4_000 - NETWORK.leadMs);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('never goes before the video starts', () => {
      const { result, onSeek } = render({ fromMs: 0 });

      result.current.onSee();

      expect(onSeek).toHaveBeenCalledWith(0);
    });
  });

  describe('onCopy', () => {
    it('copies the address and says so for a moment', async () => {
      vi.useFakeTimers();
      const writeText = vi.fn(() => Promise.resolve());

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
      });
      const { result } = render();

      await act(async () => {
        result.current.onCopy();
        await Promise.resolve();
      });

      expect(writeText).toHaveBeenCalledWith(
        'https://shop.test/api/cart?coupon=${COUPON}',
      );
      expect(result.current.copyLabel).toBe('Copied');

      act(() => {
        vi.runAllTimers();
      });

      expect(result.current.copyLabel).toBe('Copy address');
    });
  });

  describe('closing', () => {
    /** O clique fora fechava o teatro inteiro, que também fecha num clique fora. */
    it('closes only the detail on a click outside it', () => {
      const { result, onClose } = render();
      const stopPropagation = vi.fn();

      result.current.onBackdropClick({ stopPropagation } as never);

      expect(stopPropagation).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('keeps a click inside the card from closing anything', () => {
      const { result, onClose } = render();
      const stopPropagation = vi.fn();

      result.current.onCardClick({ stopPropagation } as never);

      expect(stopPropagation).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
