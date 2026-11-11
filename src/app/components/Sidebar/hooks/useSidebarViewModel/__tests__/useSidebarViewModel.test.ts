// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSidebarViewModel } from '@/app/components/Sidebar/hooks/useSidebarViewModel';
import { landAsked, startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useProStore, useSettingsStore, useWorkspaceStore } from '@/store';

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
  useProStore.setState({ shares: [] });
  useSettingsStore.setState({ isSidebarShut: false });
});

describe('useSidebarViewModel', () => {
  describe('the link to an org', () => {
    const LINKED = {
      projectId: 'p1',
      orgSlug: 'loja',
      state: 'synced' as const,
      syncedAt: null,
      pending: [],
      conflicts: [],
    };

    it('shows nothing on a project only on this computer', () => {
      const { groups } = renderHook(() => useSidebarViewModel()).result.current;

      expect(groups[0]).toMatchObject({ pro: null });
    });

    it('marks a linked project, with what waits to be sent and what came from the org', () => {
      useProStore.setState({
        shares: [
          {
            ...LINKED,
            pending: ['w1', 'w2'],
            conflicts: [
              {
                workspaceId: 'w1',
                base: [],
                version: 4,
                cases: [],
                editedBy: null,
                editedAt: '',
              },
            ],
          },
        ],
      });

      const { groups } = renderHook(() => useSidebarViewModel()).result.current;

      expect(groups[0]).toMatchObject({
        pro: {
          label: 'Shop · staging, linked to an org',
          tip: '2 to send · 1 from the org',
          pending: 2,
          updates: 1,
          hasPending: true,
          hasUpdates: true,
        },
      });
    });

    it('says nothing waits on a linked project in step with its org', () => {
      useProStore.setState({ shares: [LINKED] });

      const { groups } = renderHook(() => useSidebarViewModel()).result.current;

      expect(groups[0]).toMatchObject({
        pro: { tip: '', hasPending: false, hasUpdates: false },
      });
    });

    it('opens the project’s window on its org section', () => {
      useProStore.setState({ shares: [LINKED] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onProSettings('p1');
      });

      expect(useAppStore.getState()).toMatchObject({
        modal: 'project',
        editingProjectId: 'p1',
        projectSection: 'pro',
      });
    });
  });

  describe('rows', () => {
    it('lists just the add row for a project with no workspace', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups[0]!.rows.map(({ kind }) => kind)).toEqual(['add']);
    });

    /** Uma run pausada aparecia como "running" na sidebar enquanto esperava pelo QA. */
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
        renderHook(() => useSidebarViewModel()).result.current.groups[0]!.rows[0],
      ).toMatchObject({
        statusLabel: 'paused',
        icon: 'paused',
      });
    });

    it('nests every workspace under the project it belongs to', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups[0]!.rows[0]).toMatchObject({
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
        result.current.groups[0]!.rows.filter((row) => row.kind === 'workspace').map(
          (row) => row.kind === 'workspace' && row.platform,
        ),
      ).toEqual(['android', null]);
    });

    it('does NOT list a workspace of another project', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p2' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups[0]!.rows.map(({ kind }) => kind)).toEqual(['add']);
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
      useAppStore.setState({ selectedWorkspaceId: 'another' });
      useWorkspaceStore.setState({ workspaces: [asking()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBe('Onboarding');
    });

    /** Quem já está no workspace vê o cartão da pergunta no chat: o aviso só repetia. */
    it('does NOT warn about the workspace on screen', () => {
      useAppStore.setState({ selectedWorkspaceId: 'w1' });
      useWorkspaceStore.setState({ workspaces: [asking()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBeNull();
    });

    it('marks its row as needing the QA, over a run that goes or is paused', () => {
      const waiting = asking();

      useWorkspaceStore.setState({
        workspaces: [
          { ...waiting, live: waiting.live && { ...waiting.live, isRunning: false } },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());
      const row = result.current.groups
        .flatMap((group) => group.rows)
        .find(({ kind }) => kind === 'workspace');

      expect(row).toMatchObject({
        icon: 'attention',
        statusLabel: 'needs you',
        signal: { icon: 'attention', tone: 'var(--attn)', count: null },
        label: 'Onboarding, The agent asked you something',
      });
    });

    it('lists the workspace that waits first in its project, the others in their order', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w-a', name: 'Checkout' },
          { ...asking(), id: 'w-b' },
          { ...makeWorkspace(), id: 'w-c', name: 'Search' },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(
        result.current.groups[0]!.rows.flatMap((row) =>
          row.kind === 'workspace' ? [row.name] : [],
        ),
      ).toEqual(['Onboarding', 'Checkout', 'Search']);
    });

    it('opens the chat of the workspace that waits, where the question is', () => {
      useAppStore.setState({ selectedWorkspaceId: 'another' });
      useWorkspaceStore.setState({ workspaces: [asking()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onOpenWaiting();
      });

      expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
      expect(useWorkspaceStore.getState().isPanelOpen).toBe(true);
    });

    it('names nobody while no agent is waiting', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.waitingName).toBeNull();
    });
  });

  describe('the project as the app it tests', () => {
    const SITE = 'https://staging.loja.test/';
    const ICON = 'data:image/png;base64,iVBORw==';
    const WEB = { id: 't1', kind: 'web' as const, label: 'Web', value: SITE };
    const ANDROID = {
      id: 't2',
      kind: 'android' as const,
      label: 'Android',
      value: 'a.apk',
    };

    it('shows a web project by the icon of its site, with the host under its name', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        siteIcon: () => Promise.resolve(ICON),
      };
      useAppStore.setState({ projects: [{ ...PROJECT, targets: [WEB] }] });

      const { result } = renderHook(() => useSidebarViewModel());

      await waitFor(() => {
        expect(result.current.groups[0]).toMatchObject({
          mark: { kind: 'icon', src: ICON },
          place: 'staging.loja.test',
          hasPlace: true,
        });
      });
    });

    it('shows the platform while the site has no icon to give', () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        siteIcon: () => Promise.resolve(null),
      };
      useAppStore.setState({ projects: [{ ...PROJECT, targets: [WEB] }] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups[0]!.mark).toEqual({
        kind: 'platform',
        platform: 'web',
      });
    });

    it('shows a phone project by its platform, and names every place a project runs', () => {
      useAppStore.setState({ projects: [{ ...PROJECT, targets: [ANDROID, WEB] }] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups[0]).toMatchObject({
        mark: { kind: 'platform', platform: 'android' },
        place: 'Android, staging.loja.test',
      });
    });

    it('falls back to the initial of a project with no target, with nothing under its name', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups[0]).toMatchObject({
        mark: { kind: 'initial', initial: 'S' },
        hasPlace: false,
      });
    });
  });

  describe('the signal of a plan', () => {
    const rowOf = (result: { current: ReturnType<typeof useSidebarViewModel> }) =>
      result.current.groups[0]!.rows.find((row) => row.kind === 'workspace');

    /** O normal fica quieto: uma linha sem nada a pedir é só o nome do plano. */
    it('shows nothing on a plan that needs nothing, and reads as its name alone', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(rowOf(result)).toMatchObject({ signal: null, label: 'Checkout regression' });
    });

    it('counts the bugs a run left open, in the fail color', () => {
      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed', 'failed'], isFinished: true })],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(rowOf(result)).toMatchObject({
        signal: { icon: 'bug', tone: 'var(--fail)', count: '1', label: '1 bug' },
        label: 'Checkout regression, 1 bug',
      });
    });

    it('marks a failed run whose bugs the QA dismissed, without a count', () => {
      const walked = walkRun({ verdicts: ['passed', 'failed'], isFinished: true });

      useWorkspaceStore.setState({
        workspaces: [
          { ...walked, bugs: walked.bugs.map((bug) => ({ ...bug, isDismissed: true })) },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(rowOf(result)).toMatchObject({
        signal: { icon: 'failed', count: null, label: 'failed' },
      });
    });

    it('marks a run that goes, with how far it is in what the signal says', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(rowOf(result)?.kind === 'workspace' && rowOf(result)).toMatchObject({
        signal: { icon: 'running', tone: 'var(--lime-ink)', count: null },
      });
      expect(rowOf(result)?.kind === 'workspace' && rowOf(result)?.label).toMatch(
        /^Checkout regression, .+, \d+\/\d+$/,
      );
    });
  });

  describe('the Home row', () => {
    it('counts what waits on the QA, and nothing while every plan is at rest', () => {
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      expect(renderHook(() => useSidebarViewModel()).result.current.homeCount).toBeNull();

      useWorkspaceStore.setState({
        workspaces: [walkRun({ verdicts: ['passed', 'failed'], isFinished: true })],
      });

      expect(renderHook(() => useSidebarViewModel()).result.current.homeCount).toBe('1');
    });

    it('is marked while Home is on screen, and not inside a plan', () => {
      useAppStore.setState({ screen: 'welcome', selectedWorkspaceId: null });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      expect(renderHook(() => useSidebarViewModel()).result.current.isHome).toBe(true);

      useAppStore.setState({ screen: 'workspace', selectedWorkspaceId: 'w1' });

      expect(renderHook(() => useSidebarViewModel()).result.current.isHome).toBe(false);
    });

    it('goes back to Home, leaving the plan that was open', () => {
      useAppStore.setState({ screen: 'workspace', selectedWorkspaceId: 'w1' });
      useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onHome();
      });

      expect(useAppStore.getState()).toMatchObject({
        screen: 'welcome',
        selectedWorkspaceId: null,
      });
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

      expect(result.current.groups[0]!.rows[0]).toMatchObject({ isRemoving: true });
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

  describe('style', () => {
    it('hands the stylesheet the sizes of the rail tile, the search row, the avatar and the mark', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.style).toEqual({
        '--sidebar-tile': '36px',
        '--sidebar-field': '30px',
        '--sidebar-avatar': '22px',
        '--sidebar-lead': '16px',
        '--sidebar-mark': '20px',
      });
    });
  });

  describe('onToggle', () => {
    it('folds the sidebar to its rail, with a tip naming each row, and opens it back', () => {
      useSettingsStore.setState({ isSidebarShut: false });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.className).toBe('sidebar');
      expect(result.current.toggleLabel).toBe('Fold the sidebar');

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.className).toBe('sidebar sidebar--shut');
      expect(result.current.toggleLabel).toBe('Unfold the sidebar');
      expect(result.current.hasTips).toBe(true);

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isShut).toBe(false);
    });

    it('does NOT tip a row while the sidebar shows its words', () => {
      useSettingsStore.setState({ isSidebarShut: false });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.hasTips).toBe(false);
    });
  });

  describe('the project avatars of the folded sidebar', () => {
    it('lists one group per project, with the uppercased initial of its name', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(
        result.current.groups.map(({ projectId, initial, name }) => ({
          projectId,
          initial,
          name,
        })),
      ).toEqual([{ projectId: 'p1', initial: 'S', name: 'Shop · staging' }]);
    });

    it('marks the project of the selected workspace, and no other', () => {
      useAppStore.setState({
        projects: [PROJECT, { id: 'p2', name: 'Loja', targets: [], repositories: [] }],
        selectedWorkspaceId: 'w1',
      });
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p1' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups.map((group) => group.isSelected)).toEqual([
        true,
        false,
      ]);
    });

    it('lists the workspaces of the open project only, so the rail stays short', () => {
      useAppStore.setState({
        projects: [PROJECT, { id: 'p2', name: 'Loja', targets: [], repositories: [] }],
        selectedWorkspaceId: 'w1',
      });
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
          { ...makeWorkspace(), id: 'w2', projectId: 'p2' },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(
        result.current.groups.map(({ isExpanded, rows }) => [isExpanded, rows.length]),
      ).toEqual([
        [true, 2],
        [false, 2],
      ]);
    });

    it('selects the first workspace of the project its avatar opens', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1' },
          { ...makeWorkspace(), id: 'w2' },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onSelectProject('p1');
      });

      expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
    });

    it('opens the new-workspace modal for a project with no workspace yet', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onSelectProject('p1');
      });

      expect(useAppStore.getState().selectedWorkspaceId).toBeNull();
      expect(useAppStore.getState()).toMatchObject({
        modal: 'workspace',
        selectedProjectId: 'p1',
      });
    });
  });

  describe('onToggleProject', () => {
    it('starts the project of the selected workspace open, and the others closed', () => {
      useAppStore.setState({
        projects: [PROJECT, { id: 'p2', name: 'Loja', targets: [], repositories: [] }],
        selectedWorkspaceId: 'w1',
      });
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p1' }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups.map((group) => group.isExpanded)).toEqual([
        true,
        false,
      ]);
    });

    it('opens and closes a project on toggle, independently of the others', () => {
      useAppStore.setState({
        projects: [PROJECT, { id: 'p2', name: 'Loja', targets: [], repositories: [] }],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups.map((group) => group.isExpanded)).toEqual([
        false,
        false,
      ]);

      act(() => {
        result.current.onToggleProject('p2');
      });

      expect(result.current.groups.map((group) => group.isExpanded)).toEqual([
        false,
        true,
      ]);

      act(() => {
        result.current.onToggleProject('p2');
      });

      expect(result.current.groups.map((group) => group.isExpanded)).toEqual([
        false,
        false,
      ]);
    });

    it('follows the selection: the newly selected project opens, without a manual toggle', () => {
      useAppStore.setState({
        projects: [PROJECT, { id: 'p2', name: 'Loja', targets: [], repositories: [] }],
        selectedWorkspaceId: 'w1',
      });
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
          { ...makeWorkspace(), id: 'w2', projectId: 'p2' },
        ],
      });

      const { result, rerender } = renderHook(() => useSidebarViewModel());

      expect(result.current.groups.map((group) => group.isExpanded)).toEqual([
        true,
        false,
      ]);

      act(() => {
        useAppStore.setState({ selectedWorkspaceId: 'w2' });
      });
      rerender();

      expect(result.current.groups.map((group) => group.isExpanded)).toEqual([
        false,
        true,
      ]);
    });
  });

  describe('filter', () => {
    it('hides a project whose name and workspaces do not match it', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('zzz');
      });

      expect(result.current.groups).toEqual([]);
    });

    it('does NOT apply a leftover filter to the folded sidebar, which has no field to clear it', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('zzz');
      });

      expect(result.current.groups).toEqual([]);

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.groups).toHaveLength(1);
    });

    it('keeps a project whose name matches, with every workspace listed', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', name: 'Checkout' },
          { ...makeWorkspace(), id: 'w2', name: 'Search' },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('shop');
      });

      expect(result.current.groups[0]!.rows.map(({ kind }) => kind)).toEqual([
        'workspace',
        'workspace',
        'add',
      ]);
    });

    it('keeps a project hidden by name but matched by one of its workspaces, listing just that one', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', name: 'Checkout' },
          { ...makeWorkspace(), id: 'w2', name: 'Search' },
        ],
      });

      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('check');
      });

      expect(
        result.current.groups[0]!.rows.flatMap((row) =>
          row.kind === 'workspace' ? [row.name] : [],
        ),
      ).toEqual(['Checkout']);
    });
  });
  describe('the filter and the open projects', () => {
    const LOJA = { id: 'p2', name: 'Loja', targets: [], repositories: [] };

    beforeEach(() => {
      useAppStore.setState({ projects: [PROJECT, LOJA], selectedWorkspaceId: null });
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', projectId: 'p1', name: 'Search' },
          { ...makeWorkspace(), id: 'w2', projectId: 'p2', name: 'Checkout' },
        ],
      });
    });

    const isOpen = (groups: { projectId: string; isExpanded: boolean }[], id: string) =>
      groups.find(({ projectId }) => projectId === id)?.isExpanded;

    it('opens a closed project while one of its workspaces matches, and closes it once the filter is gone', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(isOpen(result.current.groups, 'p2')).toBe(false);

      act(() => {
        result.current.onFilterChange('check');
      });

      expect(isOpen(result.current.groups, 'p2')).toBe(true);

      act(() => {
        result.current.onFilterChange('');
      });

      expect(isOpen(result.current.groups, 'p2')).toBe(false);
    });

    it('does NOT open a project the filter reached only by its own name', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('loja');
      });

      expect(isOpen(result.current.groups, 'p2')).toBe(false);
    });

    it('lets the QA close a project the filter opened', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('check');
      });
      act(() => {
        result.current.onToggleProject('p2');
      });

      expect(isOpen(result.current.groups, 'p2')).toBe(false);
    });

    it('does NOT open a project in the folded sidebar, where the filter is not applied', () => {
      useSettingsStore.setState({ isSidebarShut: true });

      const { result } = renderHook(() => useSidebarViewModel());

      expect(isOpen(result.current.groups, 'p2')).toBe(false);
    });
  });

  describe('emptyLabel', () => {
    it('names what the QA typed when the filter hides every project', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('  zzz ');
      });

      expect(result.current.emptyLabel).toBe('No project or workspace matches “zzz”.');
    });

    it('says nothing while the list is not filtered', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      expect(result.current.emptyLabel).toBeNull();
    });

    it('says nothing while a project still matches', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('shop');
      });

      expect(result.current.emptyLabel).toBeNull();
    });

    it('says nothing in the folded sidebar, which lists every project', () => {
      const { result } = renderHook(() => useSidebarViewModel());

      act(() => {
        result.current.onFilterChange('zzz');
      });
      act(() => {
        result.current.onToggle();
      });

      expect(result.current.emptyLabel).toBeNull();
    });
  });
});
