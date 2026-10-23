// @vitest-environment jsdom
import type {
  ExportOutcome,
  IExportCode,
  IPublishPlan,
  PlanPublished,
} from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { usePlanViewModel } from '@/modules/Plan/screens/Plan/hooks/usePlanViewModel';
import { startRun } from '@/modules/Workspace';
import {
  CASES,
  makeWorkspace,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

/** A bridge whose export answers with what it is handed, and remembers what it was asked. */
function exporting(outcome: ExportOutcome) {
  const asked: IExportCode[] = [];

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    exportCode: (request) => {
      asked.push(request);

      return Promise.resolve(outcome);
    },
  };

  return asked;
}

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()], openCaseId: null });
});

/** A bridge whose Confluence takes the plan with the answer given, and remembers what it was handed. */
function publishing(outcome: PlanPublished) {
  const asked: IPublishPlan[] = [];

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    publishPlan: (plan) => {
      asked.push(plan);

      return Promise.resolve(outcome);
    },
  };

  return asked;
}

const PAGE = {
  id: '77',
  title: 'Test plan · Checkout',
  space: '',
  url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/77',
};

describe('usePlanViewModel', () => {
  describe('the variables a plan types', () => {
    const typing = () =>
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace(),
            plan: [
              {
                id: 'TC-01',
                title: 'Entrar',
                priority: 'P1',
                goal: '',
                preconditions: '',
                steps: [
                  {
                    action: 'Digitar ${LOGIN_EMAIL} e ${LOGIN_PASSWORD}',
                    expected: 'Entra',
                  },
                ],
                lastVerdict: null,
              },
            ],
          },
        ],
      });

    afterEach(() => {
      useVariablesStore.setState({ byProject: {}, request: null });
    });

    /** An exploration's plan named variables no one kept, and each run asked the QA for them. */
    it('says which ones the project does not keep, and offers to add them', () => {
      typing();
      useVariablesStore.setState({
        byProject: { p1: [{ name: 'LOGIN_PASSWORD', description: 'A senha' }] },
      });

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.missingNotice).toBe(
        'The plan types ${LOGIN_EMAIL}, which the project does not keep yet: add it, or a run asks you for it each time.',
      );

      act(() => {
        result.current.onAddMissing();
      });

      expect(useVariablesStore.getState().request).toMatchObject({
        projectId: 'p1',
        drafts: [{ name: 'LOGIN_EMAIL', description: '' }],
        by: 'plan',
      });
    });

    it('says nothing when the project keeps every one', () => {
      typing();
      useVariablesStore.setState({
        byProject: {
          p1: [
            { name: 'LOGIN_EMAIL', description: '' },
            { name: 'LOGIN_PASSWORD', description: '' },
          ],
        },
      });

      expect(
        renderHook(() => usePlanViewModel()).result.current.missingNotice,
      ).toBeNull();
    });
  });

  describe('publishing in Confluence', () => {
    beforeEach(() => {
      useSettingsStore.setState({ language: 'en' });
      useSetupStore.setState({
        integrations: [
          {
            id: 'jira',
            account: 'Ana QA',
            site: 'https://acme.atlassian.net',
            connectedAt: '2026-10-22T10:00:00.000Z',
            confluence: true,
          },
        ],
      });
    });

    it('offers to publish only with Confluence on and a plan to publish', () => {
      expect(renderHook(() => usePlanViewModel()).result.current.canPublish).toBe(true);

      useSetupStore.setState({ integrations: [] });

      expect(renderHook(() => usePlanViewModel()).result.current.canPublish).toBe(false);
    });

    it('asks where the first time, publishes the plan there, and keeps the page', async () => {
      const asked = publishing({ isPublished: true, page: PAGE });
      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.publishLabel).toBe('Publish in Confluence');

      act(() => {
        result.current.onPublish();
      });

      expect(result.current.isPublishOpen).toBe(true);
      expect(asked).toEqual([]);

      act(() => {
        result.current.onConfirmPublish({
          spaceId: '9',
          parentId: '5',
          title: 'Test plan · Checkout',
        });
      });

      await waitFor(() => {
        expect(result.current.publishNotice).toEqual({
          text: 'Published on “Test plan · Checkout”.',
          isFailed: false,
        });
      });
      expect(asked[0]).toMatchObject({
        pageId: null,
        spaceId: '9',
        parentId: '5',
        title: 'Test plan · Checkout',
      });
      expect(asked[0]?.blocks.some(({ kind }) => kind === 'table')).toBe(true);
      expect(useWorkspaceStore.getState().workspaces[0]?.published).toEqual({
        page: PAGE,
        spaceId: '9',
        parentId: '5',
      });
      expect(result.current.publishLabel).toBe('Update in Confluence');
      expect(result.current.publishedOn).toEqual({
        text: 'Published in Confluence: “Test plan · Checkout”',
        url: PAGE.url,
      });
    });

    it('updates the page it published on, with no question asked', async () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), published: { page: PAGE, spaceId: '9', parentId: null } },
        ],
      });

      const asked = publishing({ isPublished: true, page: PAGE });
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onPublish();
      });

      expect(result.current.isPublishOpen).toBe(false);
      await waitFor(() => {
        expect(asked).toHaveLength(1);
      });
      expect(asked[0]).toMatchObject({
        pageId: '77',
        spaceId: '9',
        parentId: null,
        title: 'Test plan · Checkout',
      });
    });

    it('does NOT keep a page Confluence refused, and says why in its words', async () => {
      publishing({
        isPublished: false,
        failure: 'rejected',
        said: 'A page with this title already exists',
      });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onConfirmPublish({ spaceId: '9', parentId: null, title: 'Plan' });
      });

      await waitFor(() => {
        expect(result.current.publishNotice).toEqual({
          text: 'Confluence did not take the plan. Confluence refused what QAzinho sent. A page with this title already exists',
          isFailed: true,
        });
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.published).toBeNull();

      act(() => {
        result.current.onDismissPublish();
      });

      expect(result.current.publishNotice).toBeNull();
    });
  });

  describe('onExport', () => {
    beforeEach(() => {
      useAppStore.setState({ projects: [PROJECT] });
    });

    it('exports the plan as a run walks it, and says where the code went and what is not recorded', async () => {
      const asked = exporting({
        kind: 'saved',
        folder: '/Users/qa/Downloads',
        files: ['qazinho.spec.ts'],
        exported: ['TC-01'],
        missing: ['TC-02'],
      });
      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.canExport).toBe(true);

      act(() => {
        result.current.onExport();
      });

      await waitFor(() => {
        expect(result.current.exportNotice).toBe(
          'Exported qazinho.spec.ts to /Users/qa/Downloads. Not recorded yet: TC-02. Each case that passes a run becomes code.',
        );
      });
      expect(asked[0]).toMatchObject({
        workspaceId: 'w1',
        target: { kind: 'web', value: 'https://shop.test' },
        viewport: { width: 1280, height: 800 },
      });
      expect(asked[0]?.steps).toHaveLength(6);

      act(() => {
        result.current.onDismissExport();
      });

      expect(result.current.exportNotice).toBeNull();
    });

    it('says when nothing is recorded yet, and stays quiet when the QA called the folder off', async () => {
      exporting({ kind: 'nothing', missing: ['TC-01', 'TC-02'] });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onExport();
      });

      await waitFor(() => {
        expect(result.current.exportNotice).toBe(
          'No case is recorded yet. Run the plan: each case that passes becomes code.',
        );
      });

      exporting({ kind: 'cancelled' });
      act(() => {
        result.current.onExport();
      });

      await waitFor(() => {
        expect(result.current.exportNotice).toBeNull();
      });
    });

    it('does NOT offer to export while a run walks the plan, or with no target', () => {
      useAppStore.setState({ projects: [] });

      expect(renderHook(() => usePlanViewModel()).result.current.canExport).toBe(false);

      useAppStore.setState({ projects: [PROJECT] });
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: ['passed'] })] });

      expect(renderHook(() => usePlanViewModel()).result.current.canExport).toBe(false);
    });
  });

  it('counts the cases and the steps of the plan', () => {
    const { result } = renderHook(() => usePlanViewModel());

    expect(result.current.summary).toBe('2 cases · 6 steps');
    expect(result.current.isEmpty).toBe(false);
  });

  it('counts one case of one step in the singular', () => {
    const plan = makeWorkspace()
      .plan.slice(0, 1)
      .map((testCase) => ({
        ...testCase,
        steps: testCase.steps.slice(0, 1),
      }));

    useWorkspaceStore.setState({ workspaces: [makeWorkspace(plan)] });

    expect(renderHook(() => usePlanViewModel()).result.current.summary).toBe(
      '1 case · 1 step',
    );
  });

  it('names the code the plan was made from, and nothing for a plan made from talk', () => {
    expect(renderHook(() => usePlanViewModel()).result.current.source).toBeNull();

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...makeWorkspace(),
          planSource: {
            repository: 'acme/loja-web',
            branch: 'feat/cupom',
            base: 'develop',
            commit: 'c0ffee0123456789',
          },
        },
      ],
    });

    expect(renderHook(() => usePlanViewModel()).result.current.source).toBe(
      'Made from the code of acme/loja-web: what feat/cupom at c0ffee0 changed against develop',
    );
  });

  it('hands the cases the Figma design the workspace is checked against', () => {
    expect(renderHook(() => usePlanViewModel()).result.current.design).toBeNull();

    const design = {
      url: 'https://www.figma.com/design/AbC123/Shop',
      fileKey: 'AbC123',
      nodeId: null,
      name: 'Shop',
    };

    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace(), design }] });

    expect(renderHook(() => usePlanViewModel()).result.current.design).toEqual(design);
  });

  it('names the Jira story the plan was made from, with where it opens', () => {
    expect(renderHook(() => usePlanViewModel()).result.current.story).toBeNull();

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

    expect(renderHook(() => usePlanViewModel()).result.current.story).toEqual({
      text: 'Made from the Jira story SHOP-12: Aplicar cupom',
      url: 'https://acme.atlassian.net/browse/SHOP-12',
    });
  });

  it('names the Confluence page the plan was made from, with where it opens', () => {
    expect(renderHook(() => usePlanViewModel()).result.current.page).toBeNull();

    useWorkspaceStore.setState({
      workspaces: [
        {
          ...makeWorkspace(),
          sourcePage: {
            id: '98304',
            title: 'Checkout: cenários',
            space: 'QA',
            url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
          },
        },
      ],
    });

    expect(renderHook(() => usePlanViewModel()).result.current.page).toEqual({
      text: 'Made from the Confluence page “Checkout: cenários”',
      url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
    });
  });

  it('names the whole app when the plan came from the base branch itself', () => {
    useWorkspaceStore.setState({
      workspaces: [
        {
          ...makeWorkspace(),
          planSource: {
            repository: 'acme/loja-web',
            branch: 'develop',
            base: 'develop',
            commit: 'dev0000123',
          },
        },
      ],
    });

    expect(renderHook(() => usePlanViewModel()).result.current.source).toBe(
      'Made from the code of acme/loja-web: the whole app on develop at dev0000',
    );
  });

  it('has nothing to show before the agent drafts', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace([])] });

    const { result } = renderHook(() => usePlanViewModel());

    expect(result.current.isEmpty).toBe(true);
  });

  it('hands each case the way it went in the newest run', () => {
    useWorkspaceStore.setState({
      workspaces: [
        walkRun({
          verdicts: ['passed', 'passed', 'passed', 'passed', 'failed', 'skipped'],
          isFinished: true,
        }),
      ],
    });

    const { result } = renderHook(() => usePlanViewModel());

    expect(result.current.lastRuns['TC-01']?.verdict).toBe('passed');
    expect(result.current.lastRuns['TC-02']?.steps[1]?.verdict).toBe('failed');
  });

  describe('onRemoveCase', () => {
    const ids = () =>
      useWorkspaceStore.getState().workspaces[0]?.plan.map(({ id }) => id);

    it('takes the case out and offers to bring it back, naming it', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      expect(ids()).toEqual(['TC-02']);
      expect(result.current.undo).toMatchObject({
        text: 'TC-01 removed from the plan',
        actionLabel: 'Undo',
      });
    });

    it('offers only the newest removal, under a key of its own', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      const first = result.current.undo?.key;

      act(() => {
        result.current.onRemoveCase('TC-02');
      });

      expect(result.current.undo?.text).toBe('TC-02 removed from the plan');
      expect(result.current.undo?.key).not.toBe(first);
      expect(result.current.isEmpty).toBe(true);
    });

    it('does NOT take a case out of a plan the agent is running', () => {
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

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      expect(ids()).toEqual(['TC-01', 'TC-02']);
      expect(result.current.undo).toBeNull();
    });
  });

  describe('onUndo', () => {
    const ids = () =>
      useWorkspaceStore.getState().workspaces[0]?.plan.map(({ id }) => id);

    it('puts the plan back as it was, the case in its place', () => {
      const before = useWorkspaceStore.getState().workspaces[0]?.plan;
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onUndo();
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan).toBe(before);
      expect(result.current.undo).toBeNull();
    });

    it('brings back the newest removal only', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onRemoveCase('TC-02');
      });
      act(() => {
        result.current.onUndo();
      });

      expect(ids()).toEqual(['TC-02']);
    });

    /**
     * Undo puts back the whole plan from before the removal, so it would also wipe whatever
     * changed since: the offer goes the moment the plan moves on.
     */
    it('does NOT bring the case back once the plan changed after the removal', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onAddCase();
      });

      expect(result.current.undo).toBeNull();

      act(() => {
        result.current.onUndo();
      });

      expect(ids()).not.toContain('TC-01');
      expect(ids()).toHaveLength(2);
    });

    it('does NOT bring it back into a plan a run has locked since', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });

      const removed = useWorkspaceStore.getState().workspaces[0]!;

      act(() => {
        useWorkspaceStore.setState({
          workspaces: [
            startRun({
              workspace: removed,
              startedAt: '09:41',
              runId: 'r-01',
              by: WALKED_BY,
            }),
          ],
        });
      });

      expect(result.current.undo).toBeNull();
    });

    it('lets the removal stand once its time ran out', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        result.current.onUndoExpire();
      });

      expect(result.current.undo).toBeNull();

      act(() => {
        result.current.onUndo();
      });

      expect(ids()).toEqual(['TC-02']);
    });

    it("does NOT offer one workspace's removal in another", () => {
      useWorkspaceStore.setState({
        workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2' }],
      });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onRemoveCase('TC-01');
      });
      act(() => {
        useAppStore.setState({ selectedWorkspaceId: 'w2' });
      });

      expect(result.current.undo).toBeNull();
    });
  });

  describe('onAddCase', () => {
    /** Typing right after the click used to land on nothing, and its spaces pressed buttons. */
    it('opens the new case and puts the cursor in its title', () => {
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onAddCase();
      });

      const added = useWorkspaceStore.getState().workspaces[0]?.plan.at(-1)?.id;

      expect(result.current.freshCaseId).toBe(added);
      expect(useWorkspaceStore.getState().openCaseId).toBe(added);
    });
  });

  describe('onReorder', () => {
    it('moves a case where the QA dropped it', () => {
      const { result } = renderHook(() => usePlanViewModel());
      const flipped = [...CASES].reverse();

      act(() => {
        result.current.onReorder(flipped);
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.id).toBe('TC-02');
    });

    it('does NOT let the plan move while the agent is running it', () => {
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

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.isLocked).toBe(true);

      act(() => {
        result.current.onReorder([...CASES].reverse());
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.plan[0]?.id).toBe('TC-01');
    });

    /**
     * A paused run unlocked the plan, but main walks the steps it started with: a case changed
     * or removed while paused came back from the run under the wrong title, or not at all.
     */
    it('does NOT let the plan change while the run is paused either', () => {
      const started = startRun({
        workspace: makeWorkspace(),
        startedAt: '09:41',
        runId: 'r-01',
        by: WALKED_BY,
      });

      useWorkspaceStore.setState({
        workspaces: [{ ...started, live: { ...started.live!, isRunning: false } }],
      });

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.isLocked).toBe(true);
    });

    it('names the agent that is running the plan', () => {
      useSettingsStore.setState({ agent: 'Codex' });
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

      expect(renderHook(() => usePlanViewModel()).result.current.lockedLabel).toBe(
        'Codex is running this plan. Stop the run if you want to change it.',
      );
      useSettingsStore.setState({ agent: 'Claude Code' });
    });
  });
});
