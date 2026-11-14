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
    workspaces: [
      storyPlan('w1', 'SHOP-892'),
      storyPlan('w2', 'SHOP-893'),
      storyPlan('w3', 'SHOP-894'),
      storyPlan('w4', 'SHOP-895'),
    ],
    planQueue: ['w1', 'w2', 'w3', 'w4'],
    planning: [],
    askingIds: [],
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('usePlanQueue', () => {
  it('asks the agent for three plans at once, each from its story, as the QA would', () => {
    const asked = thinkingAgent();

    renderHook(() => usePlanQueue());

    expect(asked.mock.calls.map(([ask]) => [ask.workspaceId, ask.jira?.key])).toEqual([
      ['w1', 'SHOP-892'],
      ['w2', 'SHOP-893'],
      ['w3', 'SHOP-894'],
    ]);
    expect(useWorkspaceStore.getState()).toMatchObject({
      planQueue: ['w4'],
      planning: ['w1', 'w2', 'w3'],
    });
    expect(useWorkspaceStore.getState().workspaces[0]?.chat.at(-1)).toMatchObject({
      kind: 'user',
      command: { id: 'jira-plan', key: 'SHOP-892' },
    });
  });

  it('asks for the fourth plan only once one of the three is done', () => {
    const asked = thinkingAgent();

    renderHook(() => usePlanQueue());

    expect(asked).toHaveBeenCalledTimes(3);

    act(() => {
      useWorkspaceStore.setState((state) => ({
        askingIds: state.askingIds.filter((id) => id !== 'w2'),
      }));
    });

    expect(asked).toHaveBeenCalledTimes(4);
    expect(asked.mock.calls[3]?.[0]).toMatchObject({ workspaceId: 'w4' });
    expect(useWorkspaceStore.getState()).toMatchObject({
      planQueue: [],
      planning: ['w1', 'w3', 'w4'],
    });
  });

  it('does NOT count a chat the QA started on their own against the three', () => {
    const asked = thinkingAgent();

    useWorkspaceStore.setState({ askingIds: ['w-other'] });
    renderHook(() => usePlanQueue());

    expect(asked).toHaveBeenCalledTimes(3);
  });

  it('skips a queued plan that is gone, and goes on to the next', () => {
    const asked = thinkingAgent();

    useWorkspaceStore.setState({ planQueue: ['w-gone', 'w2'] });
    renderHook(() => usePlanQueue());

    expect(asked.mock.calls.map(([ask]) => ask.workspaceId)).toEqual(['w2']);
  });
});
