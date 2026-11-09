// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useChatOnly } from '@/modules/Workspace/hooks/useChatOnly';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const only = () => renderHook(() => useChatOnly()).result.current;

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ chatDevices: {} });
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

  /** O agente andava pelo app e o QA não via nada: a tela dele some sem o painel. */
  it('brings the panel back while the chat is walking the app in its browser', () => {
    useWorkspaceStore.setState({
      workspaces: [{ ...makeWorkspace(), plan: [] }],
      chatDevices: { w1: { streamUrl: 'http://127.0.0.1:1/w1', address: null } },
    });

    expect(only()).toBe(false);
  });

  it('leaves the chat alone when the browser walking is another workspace', () => {
    useWorkspaceStore.setState({
      workspaces: [{ ...makeWorkspace(), plan: [] }],
      chatDevices: { w2: { streamUrl: 'http://127.0.0.1:1/w2', address: null } },
    });

    expect(only()).toBe(true);
  });

  it('does NOT take over a screen with no workspace', () => {
    useWorkspaceStore.setState({ workspaces: [] });

    expect(only()).toBe(false);
  });
});
