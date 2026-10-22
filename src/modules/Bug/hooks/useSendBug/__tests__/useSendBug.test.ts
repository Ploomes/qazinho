// @vitest-environment jsdom
import type { IFileBug, INetworkEntry } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSendBug } from '@/modules/Bug/hooks/useSendBug';
import { readMp4 } from '@/modules/Run/classes/video/ReplayComposer/library';
import { recordedRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

/** The run's recording: a frame a second for twelve seconds, a key frame every fourth. */
function recording(): Uint8Array {
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: 1280, height: 800 },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });

  for (let second = 0; second < 12; second += 1)
    muxer.addVideoChunkRaw(
      new Uint8Array([second]),
      second % 4 === 0 ? 'key' : 'delta',
      second * 1_000_000,
      1_000_000,
      second === 0
        ? {
            decoderConfig: {
              codec: 'avc1.640028',
              codedWidth: 1280,
              codedHeight: 800,
              description: new Uint8Array([1, 0x64, 0x00, 0x28, 0xff, 0xe0, 0x00]),
            },
          }
        : undefined,
    );

  muxer.finalize();

  return new Uint8Array(target.buffer);
}

/** The bug is caught at 1_760_000_010_000: a coupon request failed a second before it, and an old one long before. */
const NETWORK: INetworkEntry[] = [
  {
    id: 1,
    method: 'POST',
    url: 'https://shop.test/api/coupon',
    type: 'fetch',
    status: 500,
    failure: null,
    startedAt: 1_760_000_009_000,
    durationMs: 120,
    size: 30,
  },
  {
    id: 2,
    method: 'GET',
    url: 'https://shop.test/api/old',
    type: 'fetch',
    status: 404,
    failure: null,
    startedAt: 1_759_000_000_000,
    durationMs: 10,
    size: 0,
  },
];

const FILED = {
  tracker: 'jira' as const,
  key: 'SHOP-57',
  url: 'https://acme.atlassian.net/browse/SHOP-57',
  at: '2026-10-22T12:00:00.000Z',
};

let sent: IFileBug[] = [];

beforeEach(() => {
  sent = [];
  useWorkspaceStore.setState({ workspaces: [recordedRun()] });
  useAppStore.setState({
    projects: [
      {
        id: 'p1',
        name: 'Loja',
        targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://shop.test/' }],
        repositories: [],
      },
    ],
  });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    replayVideo: vi.fn().mockResolvedValue(recording()),
    runNetwork: vi.fn().mockResolvedValue(NETWORK),
    fileBug: vi.fn((request: IFileBug) => {
      sent.push(request);

      return Promise.resolve({
        isFiled: true as const,
        issue: FILED,
        missed: [],
        linked: null,
      });
    }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

const SEND = {
  filingId: 'f-1',
  workspaceId: 'w1',
  bugId: 'BUG-01',
  title: 'Submit does nothing',
};

describe('useSendBug', () => {
  describe('send', () => {
    it('sends Jira the screens, a clip of the moment and the requests that failed around it', async () => {
      const ready = vi.fn();
      const { result } = renderHook(() => useSendBug());

      await act(async () => {
        await result.current.send({
          ...SEND,
          target: { tracker: 'jira', project: 'SHOP' },
          onReady: ready,
        });
      });

      const [request] = sent;

      expect(ready).toHaveBeenCalledTimes(1);
      expect(request?.shots.map(({ name }) => name)).toEqual([
        'BUG-01 before',
        'BUG-01 broke',
      ]);
      expect(request?.video?.kind).toBe('clip');

      const clip = request?.video?.kind === 'clip' ? readMp4(request.video.data) : null;

      expect(clip?.samples[0]).toMatchObject({ timestampUs: 0, isKey: true });
      expect(request?.report.title).toBe('Submit does nothing');
      expect(request?.report.blocks).toContainEqual({
        kind: 'requests',
        items: [{ call: 'POST https://shop.test/api/coupon', outcome: '500 · 120 ms' }],
      });
      expect(request?.report.blocks).toContainEqual({
        kind: 'paragraph',
        text: 'Attached: the screen before, the screen that broke, a clip of the moment.',
      });
    });

    it('marks the bug filed, and keeps where it went for the project’s next bug', async () => {
      const { result } = renderHook(() => useSendBug());

      await act(async () => {
        await result.current.send({
          ...SEND,
          target: { tracker: 'jira', project: 'SHOP' },
          onReady: () => undefined,
        });
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.bugs[0]?.filed).toEqual(FILED);
      expect(useAppStore.getState().projects[0]?.issueTarget).toEqual({
        tracker: 'jira',
        project: 'SHOP',
      });
    });

    it('sends GitHub the words alone, and reads no video for it', async () => {
      const { result } = renderHook(() => useSendBug());

      await act(async () => {
        await result.current.send({
          ...SEND,
          target: { tracker: 'github', owner: 'acme', name: 'shop' },
          onReady: () => undefined,
        });
      });

      expect(sent[0]).toMatchObject({ shots: [], video: null, story: null });
      expect(window.qazinho.replayVideo).not.toHaveBeenCalled();
    });

    it('sends the whole recording when the run kept no MP4 to cut', async () => {
      vi.mocked(window.qazinho.replayVideo).mockResolvedValue(null);

      const { result } = renderHook(() => useSendBug());

      await act(async () => {
        await result.current.send({
          ...SEND,
          target: { tracker: 'jira', project: 'SHOP' },
          onReady: () => undefined,
        });
      });

      expect(sent[0]?.video).toEqual({
        kind: 'recording',
        name: 'BUG-01 r-01 recording',
        run: { workspaceId: 'w1', runId: 'r-01' },
      });
    });

    it('does NOT mark the bug or the project when the tracker refused it', async () => {
      window.qazinho.fileBug = vi
        .fn()
        .mockResolvedValue({ isFiled: false, failure: 'rejected', said: 'Nope.' });

      const { result } = renderHook(() => useSendBug());
      let filing: unknown = null;

      await act(async () => {
        filing = await result.current.send({
          ...SEND,
          target: { tracker: 'jira', project: 'SHOP' },
          onReady: () => undefined,
        });
      });

      expect(filing).toEqual({ isFiled: false, failure: 'rejected', said: 'Nope.' });
      expect(useWorkspaceStore.getState().workspaces[0]?.bugs[0]?.filed).toBeNull();
      expect(useAppStore.getState().projects[0]?.issueTarget).toBeUndefined();
    });
  });
});
