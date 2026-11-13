// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHomeViewModel } from '@/modules/Home/screens/Home/hooks/useHomeViewModel';
import { landAsked } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSetupStore, useWorkspaceStore } from '@/store';

const WEB = { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://loja.test/' };
const LOJA = { id: 'p1', name: 'Loja Web', targets: [WEB], repositories: [] };

const inLoja = <T extends { projectId: string; targetId: string }>(workspace: T): T => ({
  ...workspace,
  projectId: 'p1',
  targetId: 't1',
});

beforeEach(() => {
  window.qazinho = fakeQazinhoApi('darwin');
  useAppStore.setState({
    projects: [LOJA],
    recent: [],
    screen: 'welcome',
    selectedWorkspaceId: null,
  });
  useWorkspaceStore.setState({ workspaces: [], developedCases: {} });
});

describe('useHomeViewModel', () => {
  /** O normal fica quieto: um app em dia diz isso numa linha, sem cartões vazios. */
  it('says nothing needs the QA when every plan is at rest', () => {
    const { result } = renderHook(() => useHomeViewModel());

    expect(result.current).toMatchObject({ isQuiet: true, groups: [], hasRecent: false });
  });

  it('puts a question of a run first, and answers it in the chat of its plan', () => {
    const asked = landAsked({
      workspace: walkRun({ verdicts: ['passed'] }),
      question: QUESTION,
    });

    useWorkspaceStore.setState({ workspaces: [inLoja(asked)] });

    const { result } = renderHook(() => useHomeViewModel());
    const [group] = result.current.groups;

    expect(group).toMatchObject({
      id: 'asking',
      title: 'Waiting for you',
      items: [
        {
          text: 'Checkout regression asks: “Which plan should I pick?”',
          project: 'in Loja Web',
          action: 'Answer',
        },
      ],
    });

    act(() => {
      group?.items[0]?.onAction();
    });

    expect(useAppStore.getState()).toMatchObject({
      screen: 'workspace',
      selectedWorkspaceId: 'w1',
    });
    expect(useWorkspaceStore.getState().isPanelOpen).toBe(true);
  });

  it('sends a plan whose last run failed to the bugs it left open', () => {
    const failed = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

    useWorkspaceStore.setState({ workspaces: [inLoja(failed)] });

    const { result } = renderHook(() => useHomeViewModel());
    const group = result.current.groups.find(({ id }) => id === 'failed');

    expect(group?.items[0]).toMatchObject({
      text: 'Checkout regression: 1 case failed and 1 open bug',
      action: 'See the bug',
    });

    act(() => {
      group?.items[0]?.onAction();
    });

    expect(useWorkspaceStore.getState().panelTab).toBe('bugs');
  });

  it('shows a run that goes with how far it is, and opens its device', () => {
    useWorkspaceStore.setState({
      workspaces: [inLoja(walkRun({ verdicts: ['passed'] }))],
    });

    const { result } = renderHook(() => useHomeViewModel());
    const group = result.current.groups.find(({ id }) => id === 'going');

    expect(group?.items[0]?.text).toMatch(/^Checkout regression, .+ step 2 of \d+$/);

    act(() => {
      group?.items[0]?.onAction();
    });

    expect(useWorkspaceStore.getState().panelTab).toBe('device');
  });

  it('asks the main which cases have a recording, and lists the ones still to develop', async () => {
    const developedCases = vi.fn(() =>
      Promise.resolve({ caseIds: ['TC-01'], files: [] }),
    );

    window.qazinho = { ...fakeQazinhoApi('darwin'), developedCases };
    useWorkspaceStore.setState({ workspaces: [inLoja(makeWorkspace())] });

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => {
      expect(result.current.groups.map(({ id }) => id)).toEqual(['develop']);
    });
    expect(developedCases).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'w1', targetKind: 'web' }),
    );
    expect(result.current.groups[0]?.items[0]?.text).toBe(
      'Checkout regression has 1 case not recorded yet',
    );
  });

  /**
   * Abrir o Início confere no Jira do QA as histórias que um plano espera, sem agente: a
   * que chegou para teste aparece com Desenvolver.
   */
  it('reads the story a plan waits for when it opens, and offers to develop once it arrived', async () => {
    const readStatus = vi.fn(() =>
      Promise.resolve({ isRead: true as const, status: 'Ready for QA' }),
    );

    window.qazinho = { ...fakeQazinhoApi('darwin'), readStoryStatus: readStatus };
    useAppStore.setState({ projects: [{ ...LOJA, readyStatuses: ['Ready for QA'] }] });
    useSetupStore.setState({
      integrations: [
        { id: 'jira', account: 'ana@loja.test', site: 'loja.atlassian.net' },
      ],
    } as never);
    useWorkspaceStore.setState({
      storyReadAt: {},
      workspaces: [
        inLoja({
          ...makeWorkspace(),
          storyStage: 'ahead' as const,
          issue: {
            key: 'SHOP-878',
            title: 'Coupons',
            source: 'jira' as const,
            url: 'https://loja.atlassian.net/browse/SHOP-878',
          },
        }),
      ],
    });

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => {
      expect(result.current.groups.map(({ id }) => id)).toContain('arrived');
    });
    expect(readStatus).toHaveBeenCalledWith('SHOP-878');
    expect(
      result.current.groups.find(({ id }) => id === 'arrived')?.items[0],
    ).toMatchObject({
      text: 'SHOP-878 arrived for testing, so Checkout regression can be developed',
      action: 'Develop',
    });
  });

  it('lists the plans opened lately with the day and the hour, and opens one', () => {
    const at = new Date().setHours(9, 12, 0, 0);

    useWorkspaceStore.setState({ workspaces: [inLoja(makeWorkspace())] });
    useAppStore.setState({ recent: [{ workspaceId: 'w1', at }] });

    const { result } = renderHook(() => useHomeViewModel());

    expect(result.current.recent).toMatchObject([
      {
        plan: 'Checkout regression',
        when: 'today, 09:12',
        mark: { kind: 'platform', platform: 'web' },
      },
    ]);

    act(() => {
      result.current.recent[0]?.onOpen();
    });

    expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
  });

  it('says only the day of a plan opened before today', () => {
    const at = new Date().setDate(new Date().getDate() - 1);

    useWorkspaceStore.setState({ workspaces: [inLoja(makeWorkspace())] });
    useAppStore.setState({ recent: [{ workspaceId: 'w1', at }] });

    expect(renderHook(() => useHomeViewModel()).result.current.recent[0]?.when).toBe(
      'yesterday',
    );
  });
});
