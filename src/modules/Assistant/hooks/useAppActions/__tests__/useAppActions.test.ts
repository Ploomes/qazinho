// @vitest-environment jsdom
import type { IAppToolAnswer, IAppToolRequest } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppActions } from '@/modules/Assistant/hooks/useAppActions';
import { CHECKOUT, LOGIN, PROJECT } from '@/modules/Assistant/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { ASSISTANT_WAIT } from '@/shared/constants';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

/** The bridge as main drives it: a call handed to the page, and the answers the page sends back. */
function bridge() {
  const answers: IAppToolAnswer[] = [];
  let hand: (request: IAppToolRequest) => void = () => undefined;

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    onAppToolCall: (listener) => {
      hand = listener;

      return () => undefined;
    },
    answerAppTool: (answer) => {
      answers.push(answer);
    },
  };

  return { answers, call: (request: IAppToolRequest) => hand(request) };
}

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    screen: 'welcome',
    selectedWorkspaceId: null,
    modal: null,
  });
  useWorkspaceStore.setState({ workspaces: [CHECKOUT, LOGIN], tab: 'chat' });
  useSetupStore.setState({ integrations: [], connectingId: null });
  useAssistantStore.setState({ messages: [], isAsking: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useAppActions', () => {
  it('carries a call out through the stores, shows it as a line, and answers with what it did', async () => {
    const { answers, call } = bridge();

    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({
        id: 'c-1',
        call: { name: 'rename_workspace', args: { workspace: 'w2', name: 'Pix' } },
      });
    });

    await waitFor(() => {
      expect(answers).toEqual([
        { id: 'c-1', text: 'Renamed w2 from "Login" to "Pix".', isError: false },
      ]);
    });
    expect(useWorkspaceStore.getState().workspaces[1]?.name).toBe('Pix');
    expect(useAssistantStore.getState().messages).toEqual([
      {
        kind: 'tool',
        id: 'c-1',
        call: { name: 'rename_workspace', args: { workspace: 'w2', name: 'Pix' } },
        subject: 'Pix',
        state: 'done',
      },
    ]);
  });

  it('keeps what the assistant said before a tool above that tool line', async () => {
    const { answers, call } = bridge();

    useAssistantStore.setState({
      messages: [{ kind: 'user', id: 'm-1', text: 'Volta pro início' }],
      liveText: 'Já volto pro início.',
    });
    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({ id: 'c-1', call: { name: 'go_home', args: {} } });
    });

    await waitFor(() => {
      expect(answers).toHaveLength(1);
    });
    expect(useAssistantStore.getState().messages.map(({ kind }) => kind)).toEqual([
      'user',
      'agent',
      'tool',
    ]);
    expect(useAssistantStore.getState().liveText).toBe('');
  });

  it('opens a run of a workspace on screen, over whatever modal was up', async () => {
    const { answers, call } = bridge();

    useAppStore.setState({ modal: 'project' });
    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({
        id: 'c-1',
        call: { name: 'open_workspace', args: { workspace: 'w1', run: 'r-01' } },
      });
    });

    await waitFor(() => {
      expect(answers).toHaveLength(1);
    });
    expect(useAppStore.getState()).toMatchObject({
      screen: 'workspace',
      selectedWorkspaceId: 'w1',
      modal: null,
    });
    expect(useWorkspaceStore.getState()).toMatchObject({
      tab: 'runs',
      selectedRunId: 'r-01',
    });
  });

  it('waits for the QA before deleting, and deletes nothing they kept', async () => {
    const { answers, call } = bridge();

    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({ id: 'c-1', call: { name: 'delete_workspace', args: { workspace: 'w2' } } });
    });

    await waitFor(() => {
      expect(useAssistantStore.getState().messages).toEqual([
        {
          kind: 'confirm',
          id: 'c-1',
          action: 'delete_workspace',
          subject: 'Login',
          count: 0,
          decision: null,
        },
      ]);
    });
    expect(answers).toEqual([]);

    act(() => {
      useAssistantStore.getState().settleConfirm({ id: 'c-1', decision: 'kept' });
    });

    await waitFor(() => {
      expect(answers).toEqual([
        { id: 'c-1', text: 'The QA kept w2 "Login".', isError: false },
      ]);
    });
    expect(useWorkspaceStore.getState().workspaces).toHaveLength(2);
  });

  it('deletes once the QA confirms', async () => {
    const { answers, call } = bridge();

    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({ id: 'c-1', call: { name: 'delete_workspace', args: { workspace: 'w2' } } });
    });
    await waitFor(() => {
      expect(useAssistantStore.getState().messages).toHaveLength(1);
    });
    act(() => {
      useAssistantStore.getState().settleConfirm({ id: 'c-1', decision: 'confirmed' });
    });

    await waitFor(() => {
      expect(answers[0]?.text).toBe(
        'Deleted w2 "Login" with its chat, plan, runs and bugs.',
      );
    });
    expect(useWorkspaceStore.getState().workspaces.map(({ id }) => id)).toEqual(['w1']);
  });

  it('lets a confirmation nobody answers run out', async () => {
    vi.useFakeTimers();

    const { answers, call } = bridge();

    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({ id: 'c-1', call: { name: 'delete_project', args: { project: 'p1' } } });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ASSISTANT_WAIT.confirmMs);
    });

    expect(answers).toEqual([
      {
        id: 'c-1',
        text: 'The QA did not answer in time, so p1 is still there.',
        isError: false,
      },
    ]);
    expect(useAssistantStore.getState().messages[0]).toMatchObject({
      decision: 'expired',
    });
  });

  it('opens Settings on Integrations and asks the tracker card to connect', async () => {
    const { answers, call } = bridge();

    renderHook(() => {
      useAppActions();
    });
    act(() => {
      call({
        id: 'c-1',
        call: { name: 'connect_integration', args: { integration: 'github' } },
      });
    });

    await waitFor(() => {
      expect(answers).toHaveLength(1);
    });
    expect(useAppStore.getState().screen).toBe('settings');
    expect(useSettingsStore.getState().tab).toBe('integrations');
    expect(useSetupStore.getState().connectingId).toBe('github');
  });
});
