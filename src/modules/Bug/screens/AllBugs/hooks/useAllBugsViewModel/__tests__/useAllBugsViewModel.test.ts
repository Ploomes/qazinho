// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAllBugsViewModel } from '@/modules/Bug/screens/AllBugs/hooks/useAllBugsViewModel';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const WEB = { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://loja.test/' };
const LOJA = { id: 'p1', name: 'Loja Web', targets: [WEB], repositories: [] };
const FAILED = walkRun({
  verdicts: ['passed', 'passed', 'passed', 'passed', 'failed'],
  isFinished: true,
});

beforeEach(() => {
  useAppStore.setState({
    projects: [LOJA],
    screen: 'bugs',
    selectedWorkspaceId: null,
  });
  useWorkspaceStore.setState({
    workspaces: [
      { ...FAILED, projectId: 'p1', targetId: 't1' },
      { ...FAILED, id: 'w2', name: 'Login', projectId: 'p1', targetId: 't1' },
    ],
    openBugId: null,
    panelTab: 'plan',
  });
});

describe('useAllBugsViewModel', () => {
  it('lists the bugs of every plan, each with its plan', () => {
    const { result } = renderHook(() => useAllBugsViewModel());

    expect(result.current.tabs[0]?.count).toBe('2');
    expect(result.current.rows.map(({ where }) => where)).toEqual([
      'Checkout regression, step 2 of TC-02',
      'Login, step 2 of TC-02',
    ]);
  });

  it('opens a bug on its page, in the Bugs tab of its plan', () => {
    const { result } = renderHook(() => useAllBugsViewModel());

    act(() => {
      result.current.rows[1]?.onOpen();
    });

    expect(useAppStore.getState()).toMatchObject({
      screen: 'workspace',
      selectedWorkspaceId: 'w2',
    });
    expect(useWorkspaceStore.getState()).toMatchObject({
      panelTab: 'bugs',
      openBugId: 'BUG-01',
    });
  });

  it('says so when the project has no bug yet', () => {
    useWorkspaceStore.setState({ workspaces: [] });

    expect(renderHook(() => useAllBugsViewModel()).result.current.isEmpty).toBe(true);
  });

  it('names the project of each bug once there is more than one', () => {
    useAppStore.setState({
      projects: [
        LOJA,
        { id: 'p2', name: 'App da Loja', targets: [WEB], repositories: [] },
      ],
    });

    expect(renderHook(() => useAllBugsViewModel()).result.current.rows[0]?.where).toBe(
      'Checkout regression in Loja Web, step 2 of TC-02',
    );
  });
});
