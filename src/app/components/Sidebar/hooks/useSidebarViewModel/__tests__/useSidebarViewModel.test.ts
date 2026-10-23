// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSidebarViewModel } from '@/app/components/Sidebar/hooks/useSidebarViewModel';
import { suiteRun, suiteTest } from '@/modules/Automation/library/__tests__/fixtures';
import { landAsked, startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSuiteStore, useWorkspaceStore } from '@/store';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [], repositories: [] };

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    selectedWorkspaceId: null,
    modal: null,
    screen: 'workspace',
    editingProjectId: null,
  });
  useWorkspaceStore.setState({ workspaces: [], removingWorkspaceId: null });
  useSuiteStore.setState({ suites: {}, lists: {}, runs: {}, live: {}, picked: {} });
});

const SUITE = {
  projectId: 'p1',
  path: '/qa/e2e',
  name: 'chat-e2e',
  config: 'playwright.config.ts',
  version: '1.63.0',
  branch: null,
  repository: null,
  envKeys: [],
  envFileKeys: [],
};

describe('useSidebarViewModel', () => {
  describe('the suite row', () => {
    it("shows the suite a project runs under its workspaces, by the suite's name until it was read", () => {
      useSuiteStore.setState({ suites: { p1: SUITE } });

      const { rows } = renderHook(() => useSidebarViewModel()).result.current;

      expect(rows.map(({ kind }) => kind)).toEqual(['header', 'suite', 'add']);
      expect(rows[1]).toMatchObject({
        name: 'Automation',
        meta: 'chat-e2e',
        statusLabel: 'idle',
        isSelected: false,
      });
    });

    it('counts the tests once the suite was read, and how far a run going is', () => {
      useSuiteStore.setState({
        suites: { p1: SUITE },
        lists: {
          p1: {
            kind: 'listed',
            tests: [suiteTest({}), suiteTest({ id: 't-2' })],
            projects: [],
          },
        },
      });

      expect(
        renderHook(() => useSidebarViewModel()).result.current.rows[1],
      ).toMatchObject({
        meta: '2 tests',
      });

      useSuiteStore.setState({
        runs: {
          p1: [suiteRun({ status: 'running', endedAt: null, total: 40, results: [] })],
        },
        live: { p1: { runId: 's-01', going: {} } },
      });

      expect(
        renderHook(() => useSidebarViewModel()).result.current.rows[1],
      ).toMatchObject({
        meta: '0/40',
        statusLabel: 'running',
      });
    });

    it('marks a suite whose last run broke for attention, and one that failed as failed', () => {
      useSuiteStore.setState({
        suites: { p1: SUITE },
        runs: { p1: [suiteRun({ status: 'broke' })] },
      });

      expect(
        renderHook(() => useSidebarViewModel()).result.current.rows[1],
      ).toMatchObject({
        icon: 'attention',
      });

      useSuiteStore.setState({ runs: { p1: [suiteRun({ status: 'failed' })] } });

      expect(
        renderHook(() => useSidebarViewModel()).result.current.rows[1],
      ).toMatchObject({
        icon: 'failed',
        statusLabel: 'failed',
      });
    });

    it('opens the suite, and marks its row while it shows', () => {
      useSuiteStore.setState({ suites: { p1: SUITE } });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onOpenSuite('p1');
      });

      expect(useAppStore.getState()).toMatchObject({
        screen: 'automation',
        automationProjectId: 'p1',
      });
      expect(result.current.rows[1]).toMatchObject({ isSelected: true });
    });

    it('shows no suite row for a project with none', () => {
      expect(
        renderHook(() => useSidebarViewModel()).result.current.rows.map(
          ({ kind }) => kind,
        ),
      ).toEqual(['header', 'add']);
    });
  });

  describe('rows', () => {
    it('opens a project with its header and closes it with the add row', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.rows.map(({ kind }) => kind)).toEqual(['header', 'add']);
    });

    /** A paused run read "running" in the sidebar while it waited for the QA. */
    it('marks a paused run as paused, not running', () => {
      const started = startRun({
        workspace: makeWorkspace(),
        startedAt: '09:41',
        runId: 'r-01',
        by: WALKED_BY,
      });

      useWorkspaceStore.setState({
        workspaces: [{ ...started, live: { ...started.live!, isRunning: false } }],
      });

      expect(
        renderHook(() => useSidebarViewModel()).result.current.rows[1],
      ).toMatchObject({
        statusLabel: 'paused',
        icon: 'paused',
      });
    });

    it('nests every workspace under the project it belongs to', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.rows[1]).toMatchObject({
        kind: 'workspace',
        name: 'Checkout regression',
        meta: '6 steps',
        statusLabel: 'idle',
      });
    });

    it('marks each workspace with the platform it runs on, and none it cannot find', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [{ id: 't1', kind: 'android', label: 'Android', value: 'a.apk' }],
            repositories: [],
          },
        ],
      });
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', targetId: 't1' },
          { ...makeWorkspace(), id: 'w2', targetId: 'gone' },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(
        result.current.rows
          .filter((row) => row.kind === 'workspace')
          .map((row) => row.kind === 'workspace' && row.platform),
      ).toEqual(['android', null]);
    });

    it('does NOT list a workspace of another project', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p2' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.rows.map(({ kind }) => kind)).toEqual(['header', 'add']);
    });
  });

  describe('waitingName', () => {
    const asking = () => ({
      ...landAsked({
        workspace: walkRun({ verdicts: ['passed'] }),
        question: QUESTION,
      }),
      name: 'Onboarding',
    });

    it('names the workspace whose agent waits on a question', () => {
      useWorkspaceStore.setState({ workspaces: [asking()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBe('Onboarding');
    });

    it('marks its row as needing the QA, over a run that goes or is paused', () => {
      const waiting = asking();

      useWorkspaceStore.setState({
        workspaces: [
          { ...waiting, live: waiting.live && { ...waiting.live, isRunning: false } },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());
      const row = result.current.rows.find(({ kind }) => kind === 'workspace');

      expect(row).toMatchObject({
        icon: 'attention',
        statusLabel: 'needs you',
        isWaiting: true,
      });
    });

    it('opens the chat of the workspace that waits, where the question is', () => {
      useWorkspaceStore.setState({ workspaces: [asking()], isPanelWide: true });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onOpenWaiting();
      });

      expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
      expect(useWorkspaceStore.getState().isPanelWide).toBe(false);
    });

    it('names nobody while no agent is waiting', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBeNull();
    });
  });

  describe('onNewWorkspace', () => {
    it('opens the modal on the project the QA clicked under', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => result.current.onNewWorkspace('p1'));

      expect(useAppStore.getState().modal).toBe('workspace');
      expect(useAppStore.getState().selectedProjectId).toBe('p1');
    });
  });

  describe('onProjectSettings', () => {
    it('opens the project modal on the project it came from', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onProjectSettings('p1');
      });

      expect(useAppStore.getState()).toMatchObject({
        modal: 'project',
        editingProjectId: 'p1',
      });
      expect(useAppStore.getState().projects).toHaveLength(1);
    });
  });

  describe('onRemoveWorkspace', () => {
    it('asks before it removes, because a workspace holds every run it did', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onAskRemove('w1');
      });

      expect(result.current.rows[1]).toMatchObject({ isRemoving: true });
      expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);
    });

    it('drops the workspace once the QA says so', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w1');
      });

      expect(useWorkspaceStore.getState().workspaces).toEqual([]);
      expect(useWorkspaceStore.getState().removingWorkspaceId).toBeNull();
    });

    it('stops what the removed workspace had going, its run and its agent', () => {
      const stopRun = vi.fn(() => Promise.resolve());
      const stopAgent = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), stopRun, stopAgent };
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w1');
      });

      expect(stopRun).toHaveBeenCalledWith('w1');
      expect(stopAgent).toHaveBeenCalledWith('w1');
    });

    it('leaves the workspace screen when the one on it is gone', () => {
      useAppStore.setState({ selectedWorkspaceId: 'w1' });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w1');
      });

      expect(useAppStore.getState().screen).toBe('welcome');
      expect(useAppStore.getState().selectedWorkspaceId).toBeNull();
    });

    it('stays where it is when another workspace is removed', () => {
      useAppStore.setState({ selectedWorkspaceId: 'w1' });
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onRemoveWorkspace('w2');
      });

      expect(useAppStore.getState().screen).toBe('workspace');
      expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
    });
  });
});
