// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChatOnly } from '@/modules/Workspace/hooks/useChatOnly';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const only = () => renderHook(() => useChatOnly()).result.current;

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
});

describe('useChatOnly', () => {
  /** Dois painéis vazios lado a lado diziam a mesma coisa: sem plano, o chat é a tela. */
  it('leaves the chat alone while a workspace has no plan and no run', () => {
    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace(), plan: [] }] });

    expect(only()).toBe(true);
  });

  it('brings the panel back once there is a plan', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

    expect(only()).toBe(false);
  });

  it('brings the panel back for a run with no plan, like an exploration', () => {
    useWorkspaceStore.setState({
      workspaces: [{ ...walkRun({ verdicts: [] }), plan: [] }],
    });

    expect(only()).toBe(false);
  });

  it('does NOT take over a screen with no workspace', () => {
    useWorkspaceStore.setState({ workspaces: [] });

    expect(only()).toBe(false);
  });
});
