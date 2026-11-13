// @vitest-environment jsdom
import type { IAskAgent } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlanQueue } from '@/modules/Home/hooks';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const storyPlan = (id: string, key: string) => ({
  ...makeWorkspace([]),
  id,
  issue: {
    key,
    title: `Story ${key}`,
    source: 'jira' as const,
    url: `https://acme.atlassian.net/browse/${key}`,
  },
});

/** Um agente que nunca termina, então só o teste diz quando um turno acabou. */
function thinkingAgent() {
  const asked = vi.fn((_ask: IAskAgent) => new Promise<never>(() => undefined));

  window.qazinho = { ...fakeQazinhoApi('darwin'), askAgent: asked };

  return asked;
}

beforeEach(() => {
  useAppStore.setState({
    projects: [{ id: 'p1', name: 'Loja', targets: [], repositories: [] }],
  });
  useWorkspaceStore.setState({
    workspaces: [storyPlan('w1', 'SHOP-892'), storyPlan('w2', 'SHOP-893')],
    planQueue: ['w1', 'w2'],
    planning: null,
    askingIds: [],
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('usePlanQueue', () => {
  it('asks the agent for one plan at a time, from the story, as the QA would', () => {
    const asked = thinkingAgent();

    renderHook(() => usePlanQueue());

    expect(asked).toHaveBeenCalledOnce();
    expect(asked.mock.calls[0]?.[0]).toMatchObject({
      workspaceId: 'w1',
      jira: { key: 'SHOP-892' },
    });
    expect(useWorkspaceStore.getState()).toMatchObject({
      planQueue: ['w2'],
      planning: 'w1',
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
      kind: 'user',
      command: { id: 'jira-plan', key: 'SHOP-892' },
    });
  });

  it('asks for the next plan only once the chat before it is done', () => {
    const asked = thinkingAgent();

    renderHook(() => usePlanQueue());

    act(() => {
      useWorkspaceStore.setState({ askingIds: [] });
    });

    expect(asked).toHaveBeenCalledTimes(2);
    expect(asked.mock.calls[1]?.[0]).toMatchObject({ workspaceId: 'w2' });
    expect(useWorkspaceStore.getState().planQueue).toEqual([]);
  });

  it('skips a queued plan that is gone, and goes on to the next', () => {
    const asked = thinkingAgent();

    useWorkspaceStore.setState({ planQueue: ['w-gone', 'w2'] });
    renderHook(() => usePlanQueue());

    expect(asked).toHaveBeenCalledOnce();
    expect(asked.mock.calls[0]?.[0]).toMatchObject({ workspaceId: 'w2' });
  });
});
