// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { landAsked, startRun } from '@/modules/Workspace/library';
import {
  makeWorkspace,
  QUESTION,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { useWorkspaceViewModel } from '@/modules/Workspace/screens/Workspace/hooks/useWorkspaceViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1', projects: [PROJECT] });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace()],
    panelTab: 'plan',
    chatDevices: {},
  });
});

describe('useWorkspaceViewModel', () => {
  it('reads the workspace the sidebar selected', () => {
    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.name).toBe('Checkout regression');
  });

  it('reads the sentence under the title', () => {
    expect(renderHook(() => useWorkspaceViewModel()).result.current).toMatchObject({
      metaKey: 'WORKSPACE.META_ON',
      metaCases: '2 cases',
    });
  });

  describe('the center tabs', () => {
    it('reads the tab the QA left it on', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      expect(result.current.tab).toBe('plan');
    });

    it('turns to the tab the QA picked', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onSelectTab('bugs');
      });

      expect(useWorkspaceStore.getState().panelTab).toBe('bugs');
    });

    it('turns to the device on its own when a run starts', () => {
      const { rerender } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });
      });
      rerender();

      expect(useWorkspaceStore.getState().panelTab).toBe('device');
    });

    describe('while the chat walks the app in its browser', () => {
      const STREAM = { w1: { streamUrl: 'http://127.0.0.1:1/w1', address: null } };
      const planless = () => ({ ...makeWorkspace(), plan: [] });

      it('shows that browser when there is no plan to show', () => {
        useWorkspaceStore.setState({ workspaces: [planless()] });
        const { rerender } = renderHook(() => useWorkspaceViewModel());

        act(() => {
          useWorkspaceStore.setState({ chatDevices: STREAM });
        });
        rerender();

        expect(useWorkspaceStore.getState().panelTab).toBe('device');
      });

      it('goes to the plan as soon as the chat writes it', () => {
        useWorkspaceStore.setState({ workspaces: [planless()], chatDevices: STREAM });
        const { rerender } = renderHook(() => useWorkspaceViewModel());

        act(() => {
          useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
        });
        rerender();

        expect(useWorkspaceStore.getState().panelTab).toBe('plan');
      });

      it('leaves the tab of a workspace that already has a plan', () => {
        useWorkspaceStore.setState({ panelTab: 'bugs' });
        const { rerender } = renderHook(() => useWorkspaceViewModel());

        act(() => {
          useWorkspaceStore.setState({ chatDevices: STREAM });
        });
        rerender();

        expect(useWorkspaceStore.getState().panelTab).toBe('bugs');
      });

      it('lets the QA leave for another tab while it walks', () => {
        useWorkspaceStore.setState({ workspaces: [planless()], chatDevices: STREAM });
        const { rerender } = renderHook(() => useWorkspaceViewModel());

        act(() => {
          useWorkspaceStore.getState().selectTab('bugs');
        });
        rerender();

        expect(useWorkspaceStore.getState().panelTab).toBe('bugs');
      });
    });
  });

  it('offers to develop again once a case has a recording', () => {
    const { result } = renderHook(() => useWorkspaceViewModel());
    const workspace = useWorkspaceStore.getState().workspaces[0];

    expect(result.current.canRunWithAgent).toBe(false);

    act(() => {
      useWorkspaceStore.getState().setDevelopedCases({
        workspaceId: workspace?.id ?? '',
        caseIds: [workspace?.plan[0]?.id ?? ''],
      });
    });

    expect(result.current).toMatchObject({
      canRunWithAgent: true,
      developedCount: 1,
      toDevelopCount: (workspace?.plan.length ?? 0) - 1,
    });
  });

  it('links the story the workspace works from to where it opens, and nothing before one', () => {
    expect(renderHook(() => useWorkspaceViewModel()).result.current.issue).toBeNull();

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...makeWorkspace(),
          issue: {
            key: 'SHOP-12',
            title: 'Aplicar cupom',
            source: 'jira',
            url: 'https://acme.atlassian.net/browse/SHOP-12',
          },
        },
      ],
    });

    expect(renderHook(() => useWorkspaceViewModel()).result.current.issue).toEqual({
      key: 'SHOP-12',
      url: 'https://acme.atlassian.net/browse/SHOP-12',
      title: 'Aplicar cupom',
    });
  });

  describe('the Figma design', () => {
    const DESIGN = {
      url: 'https://www.figma.com/design/AbC123/Shop?node-id=12-345',
      fileKey: 'AbC123',
      nodeId: '12:345',
      name: 'Shop',
    };

    it('links the design the workspace is checked against, and nothing before one', () => {
      expect(renderHook(() => useWorkspaceViewModel()).result.current.design).toBeNull();

      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), design: DESIGN }],
      });

      expect(renderHook(() => useWorkspaceViewModel()).result.current.design).toEqual({
        name: 'Shop',
        url: DESIGN.url,
        title: 'Open the design in Figma',
      });
    });

    it('stops checking against it when the QA drops it', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), design: DESIGN }],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onDropDesign();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.design).toBeNull();
      expect(result.current.design).toBeNull();
    });
  });

  it('has no workspace to show when the selection points nowhere', () => {
    useAppStore.setState({ selectedWorkspaceId: 'gone' });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.hasWorkspace).toBe(false);
    expect(result.current.canRun).toBe(false);
  });

  it('does NOT offer a run to a workspace whose plan is empty', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.canRun).toBe(false);
  });

  it('reads the live step in the header while the agent is driving', () => {
    useWorkspaceStore.setState({
      workspaces: [
        startRun({
          workspace: makeWorkspace(),
          startedAt: '09:41',
          runId: 'r-01',
          by: WALKED_BY,
        }),
      ],
    });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.isLive).toBe(true);
    expect(result.current.statusLabel).toBe('running · step 1 of 6');
  });

  it('says the run is paused, with its step, while it waits for the QA', () => {
    const started = startRun({
      workspace: makeWorkspace(),
      startedAt: '09:41',
      runId: 'r-01',
      by: WALKED_BY,
    });

    useWorkspaceStore.setState({
      workspaces: [{ ...started, live: { ...started.live!, isRunning: false } }],
    });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.liveStatus).toBe('paused');
    expect(result.current.statusLabel).toBe('paused · step 1 of 6');
  });

  it('says the run waits on the QA while its agent asks something, paused or not', () => {
    const asking = landAsked({
      workspace: startRun({
        workspace: makeWorkspace(),
        startedAt: '09:41',
        runId: 'r-01',
        by: WALKED_BY,
      }),
      question: QUESTION,
    });

    useWorkspaceStore.setState({
      workspaces: [{ ...asking, live: { ...asking.live!, isRunning: false } }],
    });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.liveStatus).toBe('attention');
    expect(result.current.statusLabel).toBe('step 1 of 6');
  });

  it('says an exploration waits on the QA while its agent asks something', () => {
    useWorkspaceStore.setState({
      workspaces: [
        landAsked({
          workspace: startRun({
            workspace: makeWorkspace([]),
            startedAt: '10:00',
            runId: 'r-01',
            by: WALKED_BY,
            kind: 'explore',
          }),
          question: QUESTION,
        }),
      ],
    });

    expect(renderHook(() => useWorkspaceViewModel()).result.current.statusLabel).toBe(
      '0 screens',
    );
  });

  it('counts the steps of the cases the run walks, not the whole plan', () => {
    const walked = walkRun({ verdicts: ['passed'] });

    useWorkspaceStore.setState({
      workspaces: [{ ...walked, live: { ...walked.live!, caseIds: ['TC-02'] } }],
    });

    expect(renderHook(() => useWorkspaceViewModel()).result.current.statusLabel).toBe(
      'running · step 2 of 3',
    );
  });

  /** O cabeçalho dizia "passo 0 de 1" enquanto o primeiro passo rodava. */
  it('names the step being walked, and never one past the last', () => {
    useWorkspaceStore.setState({
      workspaces: [
        walkRun({
          verdicts: ['passed', 'passed', 'passed', 'passed', 'passed', 'passed'],
        }),
      ],
    });

    expect(renderHook(() => useWorkspaceViewModel()).result.current.statusLabel).toBe(
      'running · step 6 of 6',
    );
  });

  describe('onRun', () => {
    it('starts the run of the workspace on screen', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('runs an android target too, because QAzinho drives a phone now', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [
              { id: 't1', kind: 'android', label: 'Android', value: '/tmp/app.apk' },
            ],
            repositories: [],
          },
        ],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    /**
     * As runs de iOS eram recusadas aqui enquanto o idb nunca tinha tocado um simulador
     * real; agora tocou.
     */
    it('runs an iOS build on the simulator, the way it runs the rest', () => {
      useAppStore.setState({
        projects: [
          {
            ...PROJECT,
            targets: [{ id: 't1', kind: 'ios', label: 'iOS', value: '/tmp/App.app' }],
            repositories: [],
          },
        ],
      });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('running');
    });

    it('says so instead of pretending when the target left the project', () => {
      useAppStore.setState({ projects: [{ ...PROJECT, targets: [], repositories: [] }] });

      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRun();
      });

      const [workspace] = useWorkspaceStore.getState().workspaces;

      expect(workspace?.status).toBe('stopped');
      expect(workspace?.chat.at(-1)).toMatchObject({
        kind: 'error',
        text: expect.stringContaining('gone from its project') as string,
      });
    });
  });

  describe('pauseLabel', () => {
    it('reads resume while the run is held, and pause while it goes', () => {
      const walked = walkRun({ verdicts: ['passed'] });

      useWorkspaceStore.setState({ workspaces: [walked] });

      expect(renderHook(() => useWorkspaceViewModel()).result.current.pauseLabel).toBe(
        'Pause',
      );

      useWorkspaceStore.setState({
        workspaces: [{ ...walked, live: { ...walked.live!, isRunning: false } }],
      });

      expect(renderHook(() => useWorkspaceViewModel()).result.current.pauseLabel).toBe(
        'Resume',
      );
    });
  });

  describe('onRename', () => {
    it('renames the open workspace, so the sidebar and the disk follow', () => {
      const { result } = renderHook(() => useWorkspaceViewModel());

      act(() => {
        result.current.onRename('Checkout');
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.name).toBe('Checkout');
    });
  });
  it('offers an exploration even with no plan, and never while something walks', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => useWorkspaceViewModel());

    expect(result.current.canExplore).toBe(true);
    expect(result.current.exploreTip).toContain('10 minutes');

    act(() => {
      useWorkspaceStore.setState({
        workspaces: [
          startRun({
            workspace: makeWorkspace([]),
            startedAt: '10:00',
            runId: 'r-01',
            by: WALKED_BY,
            kind: 'explore',
          }),
        ],
      });
    });

    expect(result.current.canExplore).toBe(false);
    expect(result.current.statusLabel).toBe('exploring · 0 screens');
  });
});
