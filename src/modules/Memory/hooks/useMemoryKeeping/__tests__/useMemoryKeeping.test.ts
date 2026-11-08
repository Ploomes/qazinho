// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IKeepMemories, MemoryKeeping } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useMemoryKeeping } from '@/modules/Memory/hooks/useMemoryKeeping';
import { useAppStore, useMemoryStore, useWorkspaceStore } from '@/store';

const PROJECT: IProject = { id: 'p-1', name: 'Loja', targets: [], repositories: [] };
const WORKSPACE = { id: 'w-1', projectId: 'p-1', chat: [] } as unknown as IWorkspace;
const said = (text: string) => ({ kind: 'said' as const, text });

/** A bridge da main, escrita à mão: guarda o que foi pedido e responde o que o teste manda. */
const bridgeWith = (answer: () => Promise<MemoryKeeping>) => {
  const asked: IKeepMemories[] = [];

  Object.assign(window, {
    qazinho: {
      keepMemories: (request: IKeepMemories) => {
        asked.push(request);

        return answer();
      },
    },
  });

  return asked;
};

describe('useMemoryKeeping', () => {
  beforeEach(() => {
    useMemoryStore.setState({ waiting: [], isKeeping: false });
    useAppStore.setState({ projects: [PROJECT] });
    useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
  });

  afterEach(() => {
    Object.assign(window, { qazinho: undefined });
  });

  const enqueue = (text: string, workspaceId = 'w-1') => {
    act(() => {
      useMemoryStore
        .getState()
        .enqueue({ projectId: 'p-1', workspaceId, events: [said(text)] });
    });
  };

  it('asks once for what waits, and keeps what the agent answered', async () => {
    const asked = bridgeWith(() =>
      Promise.resolve({
        isKept: true,
        ops: [
          { op: 'add', text: 'O SSO não funciona.', scope: 'project', target: 'all' },
        ],
      }),
    );

    renderHook(() => useMemoryKeeping());
    enqueue('o sso não funciona');

    await waitFor(() => {
      expect(useMemoryStore.getState().isKeeping).toBe(false);
      expect(useAppStore.getState().projects[0]?.memories).toHaveLength(1);
    });
    expect(asked).toHaveLength(1);
    expect(asked[0]?.events).toEqual([said('o sso não funciona')]);
  });

  it('tells the chat what it noted', async () => {
    bridgeWith(() =>
      Promise.resolve({
        isKept: true,
        ops: [
          { op: 'add', text: 'O SSO não funciona.', scope: 'project', target: 'all' },
        ],
      }),
    );

    renderHook(() => useMemoryKeeping());
    enqueue('o sso não funciona');

    await waitFor(() => {
      expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
        kind: 'memory',
        changes: [{ kind: 'added', text: 'O SSO não funciona.' }],
      });
    });
  });

  it('says nothing and changes nothing when nothing is worth keeping', async () => {
    bridgeWith(() => Promise.resolve({ isKept: true, ops: [] }));

    renderHook(() => useMemoryKeeping());
    enqueue('roda de novo por favor');

    await waitFor(() => {
      expect(useMemoryStore.getState().isKeeping).toBe(false);
    });
    expect(useAppStore.getState().projects[0]?.memories).toBeUndefined();
    expect(useWorkspaceStore.getState().workspaces[0]?.chat).toEqual([]);
  });

  it('carries on when the agent could not answer', async () => {
    bridgeWith(() => Promise.reject(new Error('sem agente')));

    renderHook(() => useMemoryKeeping());
    enqueue('o sso não funciona');

    await waitFor(() => {
      expect(useMemoryStore.getState().isKeeping).toBe(false);
    });
    expect(useAppStore.getState().projects[0]?.memories).toBeUndefined();
  });

  it('does one at a time, and hears the second against what the first kept', async () => {
    let release = () => undefined as void;
    const held = new Promise<void>((settle) => {
      release = settle;
    });
    const answers: (() => Promise<MemoryKeeping>)[] = [
      async () => {
        await held;

        return {
          isKept: true,
          ops: [{ op: 'add', text: 'Em Ajustes.', scope: 'project', target: 'all' }],
        };
      },
      () => Promise.resolve({ isKept: true, ops: [] }),
    ];
    const asked = bridgeWith(() => (answers.shift() as () => Promise<MemoryKeeping>)());

    useWorkspaceStore.setState({
      workspaces: [WORKSPACE, { ...WORKSPACE, id: 'w-2' }],
    });
    renderHook(() => useMemoryKeeping());
    enqueue('primeira', 'w-1');
    enqueue('segunda', 'w-2');

    await waitFor(() => {
      expect(asked).toHaveLength(1);
    });

    act(() => {
      release();
    });

    await waitFor(() => {
      expect(asked).toHaveLength(2);
    });
    expect(asked[1]?.memories.map(({ text }) => text)).toEqual(['Em Ajustes.']);
  });

  it('drops a request of a project that no longer exists', async () => {
    const asked = bridgeWith(() => Promise.resolve({ isKept: true, ops: [] }));

    useAppStore.setState({ projects: [] });
    renderHook(() => useMemoryKeeping());
    enqueue('o sso não funciona');

    await waitFor(() => {
      expect(useMemoryStore.getState().isKeeping).toBe(false);
    });
    expect(asked).toEqual([]);
  });
});
