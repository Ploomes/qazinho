// @vitest-environment jsdom
import type { ISourcesCheckAsk, ISourcesChecked } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSourceCheck } from '@/shared/hooks/useSourceCheck';
import { useWorkspaceStore } from '@/store';

const SNAP = {
  kind: 'story' as const,
  key: 'SHOP-878',
  url: 'https://shop.atlassian.net/browse/SHOP-878',
  text: 'C3. 3 tentativas',
  at: '2026-11-13T13:00:00.000Z',
};
const FOUND = {
  kind: 'story' as const,
  key: 'SHOP-878',
  url: SNAP.url,
  at: '2026-11-13T15:00:00.000Z',
  before: 'C3. 3 tentativas',
  after: 'C3. 5 tentativas',
  comments: [],
};

function sources(checked: Partial<ISourcesChecked>) {
  const check = vi.fn((ask: ISourcesCheckAsk) =>
    Promise.resolve({
      changes: [],
      snapshots: ask.snapshots,
      code: ask.code,
      missed: [],
      ...checked,
    }),
  );

  window.qazinho = { ...fakeQazinhoApi('darwin'), checkSources: check };

  return check;
}

const now = () => useWorkspaceStore.getState().workspaces[0];

beforeEach(() => {
  useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace(), snapshots: [SNAP] }] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSourceCheck', () => {
  it('reads the sources again against how they read, and keeps what changed', async () => {
    const check = sources({
      changes: [FOUND],
      snapshots: [{ ...SNAP, text: 'C3. 5 tentativas' }],
    });
    const { result } = renderHook(() => useSourceCheck());

    await act(() => result.current.check('w1'));

    expect(check).toHaveBeenCalledWith({ snapshots: [SNAP], code: null });
    expect(now()?.changed).toMatchObject({
      found: [FOUND],
      snapshots: [{ ...SNAP, text: 'C3. 5 tentativas' }],
    });
  });

  it('lets go of a change that is no longer there, unless a review is open', async () => {
    sources({});
    useWorkspaceStore.setState({
      workspaces: [
        {
          ...makeWorkspace(),
          snapshots: [SNAP],
          changed: { found: [FOUND], snapshots: [], code: null, at: '' },
        },
      ],
    });

    const { result } = renderHook(() => useSourceCheck());

    await act(() => result.current.check('w1'));

    expect(now()).not.toHaveProperty('changed');
  });

  it('does NOT ask anything of a plan that came from no source', async () => {
    const check = sources({});

    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

    const { result } = renderHook(() => useSourceCheck());

    expect(await result.current.check('w1')).toBeNull();
    expect(check).not.toHaveBeenCalled();
  });
});
