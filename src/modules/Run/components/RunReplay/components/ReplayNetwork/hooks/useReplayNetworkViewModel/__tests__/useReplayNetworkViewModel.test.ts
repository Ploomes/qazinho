// @vitest-environment jsdom
import type { IReplayRequest } from '@/modules/Run/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReplayNetworkViewModel } from '@/modules/Run/components/RunReplay/components/ReplayNetwork/hooks/useReplayNetworkViewModel';
import { NETWORK } from '@/modules/Run/constants';

const request = (props: Partial<IReplayRequest>): IReplayRequest => ({
  id: 1,
  method: 'GET',
  url: 'https://shop.test/',
  host: null,
  path: '/',
  type: 'fetch',
  isApi: true,
  outcome: 'ok',
  status: 200,
  failure: null,
  fromMs: 0,
  toMs: 120,
  durationMs: 120,
  size: 1_884,
  body: null,
  ...props,
});

const REQUESTS = [
  request({ id: 1 }),
  request({
    id: 2,
    type: 'script',
    isApi: false,
    url: 'https://cdn.test/app.js',
    host: 'cdn.test',
    path: '/app.js',
    fromMs: 200,
    toMs: 260,
    durationMs: 60,
  }),
  request({
    id: 3,
    method: 'POST',
    type: 'fetch',
    url: 'https://shop.test/api/checkout',
    path: '/api/checkout',
    outcome: 'server',
    status: 500,
    fromMs: 4_000,
    toMs: 4_430,
    durationMs: 430,
    size: 210,
  }),
  request({
    id: 4,
    type: 'fetch',
    url: 'https://stats.test/collect?token=•••',
    host: 'stats.test',
    path: '/collect?token=•••',
    outcome: 'failed',
    status: null,
    failure: 'net::ERR_CONNECTION_REFUSED',
    fromMs: 5_000,
    toMs: 5_010,
    durationMs: 10,
    size: null,
  }),
];

function render(props: { currentMs: number; isShowingAll?: boolean }) {
  const onPick = vi.fn();
  const onToggleAll = vi.fn();
  const { result } = renderHook(() =>
    useReplayNetworkViewModel({
      requests: REQUESTS,
      currentMs: props.currentMs,
      isShowingAll: props.isShowingAll ?? false,
      onToggleAll,
      onPick,
    }),
  );

  return { result, onPick, onToggleAll };
}

describe('useReplayNetworkViewModel', () => {
  describe('rows', () => {
    it('lands each request as the video reaches it, the files kept out', () => {
      expect(
        render({ currentMs: 300 }).result.current.rows.map(({ key }) => key),
      ).toEqual([1]);
      expect(
        render({ currentMs: 4_100 }).result.current.rows.map(({ key }) => key),
      ).toEqual([1, 3]);
    });

    it('waits on a request until its answer came, with a spinner, no code and no size', () => {
      const [, waiting] = render({ currentMs: 4_200 }).result.current.rows;

      expect(waiting).toMatchObject({
        statusKey: 'waiting',
        icon: 'pending',
        statusText: '',
        statusLabel: 'Waiting for the answer',
        time: '200 ms',
        size: '',
        className: 'replay-network__row replay-network__row--pending',
      });
    });

    it('shows the status code once the answer came, in the colour of its class', () => {
      const [, answered] = render({ currentMs: 4_500 }).result.current.rows;

      expect(answered).toMatchObject({
        statusKey: 'done',
        icon: 'failed',
        statusText: '500',
        method: 'POST',
        path: '/api/checkout',
        type: 'fetch',
        time: '430 ms',
        size: '210 B',
        className: 'replay-network__row replay-network__row--fail',
      });
    });

    it('says a failure in words, with what Chrome said in its tooltip', () => {
      const failed = render({ currentMs: 6_000 }).result.current.rows.at(-1);

      expect(failed).toMatchObject({
        statusText: 'failed',
        icon: 'blocked',
        hasHost: true,
        host: 'stats.test',
        size: '',
      });
      expect(failed?.title).toBe(
        'GET https://stats.test/collect?token=•••\nnet::ERR_CONNECTION_REFUSED',
      );
    });

    it('slides in only a request that just started, never one a seek passed over', () => {
      const [fresh] = render({ currentMs: 100 }).result.current.rows;
      const [old] = render({ currentMs: NETWORK.freshMs + 1 }).result.current.rows;

      expect(fresh?.initial).not.toBe(false);
      expect(old?.initial).toBe(false);
    });

    it('marks the latest request as the one the video is on', () => {
      const rows = render({ currentMs: 4_100 }).result.current.rows;

      expect(rows.map(({ isLatest }) => isLatest)).toEqual([false, true]);
    });

    /** Um clique levava o vídeo até o pedido, e num pedido do começo parecia recarregar. */
    it('opens the detail of the request clicked, without moving the video', () => {
      const { result, onPick } = render({ currentMs: 6_000 });

      result.current.rows[1]?.onClick();

      expect(onPick).toHaveBeenCalledExactlyOnceWith(result.current.rows[1]?.key);
    });
  });

  describe('head', () => {
    it('counts the requests so far of all the run made', () => {
      expect(render({ currentMs: 4_100 }).result.current.count).toBe('2 of 3');
    });

    it('counts the errors only once they came back', () => {
      expect(render({ currentMs: 4_100 }).result.current.hasErrors).toBe(false);
      expect(render({ currentMs: 6_000 }).result.current).toMatchObject({
        hasErrors: true,
        errors: '2 errors',
      });
    });

    it('offers the other requests it keeps out, and only the API calls again once shown', () => {
      expect(render({ currentMs: 0 }).result.current).toMatchObject({
        hasOthers: true,
        othersLabel: '+1 other request',
      });
      expect(
        render({ currentMs: 0, isShowingAll: true }).result.current.othersLabel,
      ).toBe('API calls only');
    });

    it('lists every request once all are shown', () => {
      expect(
        render({ currentMs: 300, isShowingAll: true }).result.current.rows.map(
          ({ key }) => key,
        ),
      ).toEqual([1, 2]);
    });
  });

  describe('empty', () => {
    it('says nothing went over the network before the first request', () => {
      const { result } = renderHook(() =>
        useReplayNetworkViewModel({
          requests: [request({ fromMs: 2_000 })],
          currentMs: 0,
          isShowingAll: false,
          onToggleAll: vi.fn(),
          onPick: vi.fn(),
        }),
      );

      expect(result.current).toMatchObject({
        isEmpty: true,
        empty: 'No calls yet.',
      });
    });

    /** Um site sem API: a página e o favicon passam pela rede, e nenhuma chamada. */
    it('says the app made no API calls when only pages and files went over the network', () => {
      const { result } = renderHook(() =>
        useReplayNetworkViewModel({
          requests: [
            request({ id: 1, type: 'document', isApi: false }),
            request({ id: 2, type: 'other', path: '/favicon-32.png', isApi: false }),
          ],
          currentMs: 5_000,
          isShowingAll: false,
          onToggleAll: vi.fn(),
          onPick: vi.fn(),
        }),
      );

      expect(result.current).toMatchObject({
        isEmpty: true,
        empty: 'The app made no API calls.',
        othersLabel: '+2 other requests',
      });
    });
  });
});
