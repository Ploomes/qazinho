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
  type: 'document',
  isFile: false,
  outcome: 'ok',
  status: 200,
  failure: null,
  fromMs: 0,
  toMs: 120,
  durationMs: 120,
  size: 1_884,
  ...props,
});

const REQUESTS = [
  request({ id: 1 }),
  request({
    id: 2,
    type: 'script',
    isFile: true,
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

function render(props: { currentMs: number; isShowingFiles?: boolean }) {
  const onSeek = vi.fn();
  const onToggleFiles = vi.fn();
  const { result } = renderHook(() =>
    useReplayNetworkViewModel({
      requests: REQUESTS,
      currentMs: props.currentMs,
      isShowingFiles: props.isShowingFiles ?? false,
      onToggleFiles,
      onSeek,
    }),
  );

  return { result, onSeek, onToggleFiles };
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
        icon: 'close',
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

    it('jumps the video to a little before a request on a click', () => {
      const { result, onSeek } = render({ currentMs: 6_000 });

      result.current.rows[1]?.onClick();

      expect(onSeek).toHaveBeenCalledWith(4_000 - NETWORK.leadMs);
    });

    it('never jumps before the video starts', () => {
      const { result, onSeek } = render({ currentMs: 6_000 });

      result.current.rows[0]?.onClick();

      expect(onSeek).toHaveBeenCalledWith(0);
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

    it('offers the files it keeps out, and hides them again once shown', () => {
      expect(render({ currentMs: 0 }).result.current).toMatchObject({
        hasFiles: true,
        filesLabel: '+1 file',
      });
      expect(
        render({ currentMs: 0, isShowingFiles: true }).result.current.filesLabel,
      ).toBe('Hide files');
    });

    it('lists the files once shown', () => {
      expect(
        render({ currentMs: 300, isShowingFiles: true }).result.current.rows.map(
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
          isShowingFiles: false,
          onToggleFiles: vi.fn(),
          onSeek: vi.fn(),
        }),
      );

      expect(result.current).toMatchObject({
        isEmpty: true,
        empty: 'Nothing went over the network yet.',
      });
    });

    it('says only files went over it when the run made nothing else', () => {
      const { result } = renderHook(() =>
        useReplayNetworkViewModel({
          requests: [request({ type: 'image', isFile: true })],
          currentMs: 5_000,
          isShowingFiles: false,
          onToggleFiles: vi.fn(),
          onSeek: vi.fn(),
        }),
      );

      expect(result.current.empty).toBe('Only files went over the network.');
    });
  });
});
