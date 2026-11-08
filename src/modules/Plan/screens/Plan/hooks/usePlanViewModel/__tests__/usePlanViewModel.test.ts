// @vitest-environment jsdom
import type {
  ExportOutcome,
  IApplyVariables,
  IExportCode,
  IPublishPlan,
  PlanPublished,
  UnreadPlanRead,
  VariablesOutcome,
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
  useProStore,
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

/** Uma bridge cuja exportação responde com o que recebe, e lembra o que lhe pediram. */
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
  useProStore.setState({ shares: [] });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace()],
    openCaseId: null,
  });
});

/**
 * Uma bridge cujo Confluence aceita o plano com a resposta dada, e lembra o que recebeu.
 */
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

    /**
     * O plano de uma exploração nomeava variáveis que ninguém guardou, e cada run as
     * pedia ao QA.
     */
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
      expect(result.current.sources).toEqual([
        {
          key: 'published',
          label: 'Published to Confluence',
          tag: null,
          title: 'Test plan · Checkout',
          url: PAGE.url,
        },
      ]);
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
        expect(result.current.exportNotice).toBe('Exported to Downloads.');
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
        expect(result.current.exportNotice).toBe('No case recorded yet.');
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
    expect(renderHook(() => usePlanViewModel()).result.current.sources).toEqual([]);

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

    expect(renderHook(() => usePlanViewModel()).result.current.sources).toEqual([
      {
        key: 'code',
        label: 'Code',
        tag: 'acme/loja-web',
        title: 'what feat/cupom at c0ffee0 changed against develop',
        url: null,
      },
    ]);
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
    expect(renderHook(() => usePlanViewModel()).result.current.sources).toEqual([]);

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

    expect(renderHook(() => usePlanViewModel()).result.current.sources).toEqual([
      {
        key: 'story',
        label: 'Jira story',
        tag: 'SHOP-12',
        title: 'Aplicar cupom',
        url: 'https://acme.atlassian.net/browse/SHOP-12',
      },
    ]);
  });

  it('names the Confluence page the plan was made from, with where it opens', () => {
    expect(renderHook(() => usePlanViewModel()).result.current.sources).toEqual([]);

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

    expect(renderHook(() => usePlanViewModel()).result.current.sources).toEqual([
      {
        key: 'page',
        label: 'Confluence page',
        tag: null,
        title: 'Checkout: cenários',
        url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
      },
    ]);
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

    expect(renderHook(() => usePlanViewModel()).result.current.sources[0]?.title).toBe(
      'the whole app on develop at dev0000',
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
     * Desfazer devolve o plano inteiro de antes da remoção, então também apagaria o que
     * mudou desde então: a oferta some no momento em que o plano segue.
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

  describe('a secret written out in the plan', () => {
    /**
     * Uma bridge cujo keychain responde como mandado, e lembra o que lhe pediram para
     * guardar.
     */
    function sealing(outcome: VariablesOutcome) {
      const asked: IApplyVariables[] = [];

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        applyVariables: (apply) => {
          asked.push(apply);

          return Promise.resolve(outcome);
        },
      };

      return asked;
    }

    const writing = () =>
      useWorkspaceStore.setState({
        workspaces: [
          {
            ...makeWorkspace(),
            plan: [
              {
                ...CASES[0]!,
                id: 'TC-01',
                steps: [
                  {
                    action: 'Entrar com qa@loja.test e a senha Teste-1234',
                    expected: 'Entra',
                  },
                ],
              },
            ],
          },
        ],
      });

    afterEach(() => {
      useVariablesStore.setState({ byProject: {}, request: null });
    });

    /** Um QA vindo do teste manual escreveu a senha no passo, e ela ia em toda run. */
    it('names the case that writes it and offers to keep it as a variable', () => {
      writing();

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.secretNotice).toMatchObject({
        text: expect.stringContaining('TC-01 writes a password out in the plan'),
        failure: null,
      });
    });

    it('seals it under a free name and writes the name in its place', async () => {
      writing();
      useVariablesStore.setState({
        byProject: { p1: [{ name: 'PASSWORD', description: 'Another one' }] },
      });

      const asked = sealing({ isSaved: true, variables: [] });
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onKeepSecret();
      });

      await waitFor(() => {
        expect(
          useWorkspaceStore.getState().workspaces[0]?.plan[0]?.steps[0]?.action,
        ).toBe('Entrar com qa@loja.test e a senha ${PASSWORD_2}');
      });
      expect(asked[0]?.changes).toEqual([
        {
          kind: 'save',
          name: 'PASSWORD_2',
          description: 'The password TC-01 signs in with',
          value: 'Teste-1234',
          from: null,
        },
      ]);
      expect(result.current.secretNotice).toBeNull();
    });

    /** Um caso que tenta uma senha errada de propósito escreve uma que não é segredo. */
    it('stops naming a value the QA said is no secret, and remembers it', () => {
      writing();

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onPlainSecret();
      });

      expect(result.current.secretNotice).toBeNull();
      expect(useWorkspaceStore.getState().workspaces[0]?.plainValues).toEqual([
        'Teste-1234',
      ]);
    });

    it('does NOT touch the plan when the keychain kept nothing, and says why', async () => {
      writing();
      sealing({ isSaved: false, failure: { reason: 'no-keychain' } });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onKeepSecret();
      });

      await waitFor(() => {
        expect(result.current.secretNotice?.failure).toContain('no keychain');
      });
      expect(
        useWorkspaceStore.getState().workspaces[0]?.plan[0]?.steps[0]?.action,
      ).toContain('Teste-1234');
    });
  });

  describe('a plan.yaml that did not open', () => {
    const UNREAD = { file: 'plan.unread-20261023-052607.yaml', line: 7 };

    /**
     * Uma bridge cujo plano posto de lado lê como mandado, e lembra cada arquivo pedido.
     */
    function rereading(read: UnreadPlanRead) {
      const asked: string[] = [];

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        readUnreadPlan: ({ file }) => {
          asked.push(file);

          return Promise.resolve(read);
        },
      };

      return asked;
    }

    function setAside(plan = makeWorkspace().plan) {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), plan, unreadPlan: UNREAD }],
      });
    }

    it('says where the file broke and where it was kept', () => {
      setAside([]);

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.unread).toMatchObject({
        text: expect.stringContaining('line 7'),
        again: null,
        canRead: true,
      });
      expect(result.current.unread?.text).toContain(UNREAD.file);
    });

    it('takes the fixed file back into the plan, after the cases written since', async () => {
      setAside([CASES[0]!]);
      rereading({
        status: 'read',
        yaml: 'cases:\n  - id: TC-01\n    title: From the file\n    steps:\n      - action: Open\n        expected: Opens\n',
      });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onReadUnread();
      });

      await waitFor(() => {
        expect(useWorkspaceStore.getState().workspaces[0]?.unreadPlan).toBeNull();
      });
      expect(
        useWorkspaceStore.getState().workspaces[0]?.plan.map(({ title }) => title),
      ).toEqual([CASES[0]!.title, 'From the file']);
    });

    it('does NOT clear the notice while the file still breaks, and says where now', async () => {
      setAside([]);
      rereading({ status: 'unreadable', line: 12 });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onReadUnread();
      });

      await waitFor(() => {
        expect(result.current.unread?.again).toBe('It still does not open, at line 12.');
      });
      expect(useWorkspaceStore.getState().workspaces[0]?.unreadPlan).toEqual(UNREAD);
    });

    it('stops offering to read a file gone from the folder', async () => {
      setAside([]);
      rereading({ status: 'gone' });

      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onReadUnread();
      });

      await waitFor(() => {
        expect(result.current.unread?.canRead).toBe(false);
      });
    });

    it('lets the notice go, leaving the file where it was kept', () => {
      setAside([]);

      const asked = rereading({ status: 'gone' });
      const { result } = renderHook(() => usePlanViewModel());

      act(() => {
        result.current.onDismissUnread();
      });

      expect(result.current.unread).toBeNull();
      expect(asked).toEqual([]);
    });
  });

  describe('onAddCase', () => {
    /** Digitar logo depois do clique não caía em nada, e os espaços apertavam botões. */
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
     * Uma run pausada destravava o plano, mas a main anda os passos com que começou: um
     * caso mudado ou removido durante a pausa voltava da run sob o título errado, ou nem
     * voltava.
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

  describe('org changes', () => {
    const MOVED = {
      projectId: 'p1',
      orgSlug: 'loja',
      state: 'conflict' as const,
      syncedAt: null,
      pending: [],
      conflicts: [
        {
          workspaceId: 'w1',
          base: [],
          version: 4,
          cases: [],
          editedBy: 'Bruno',
          editedAt: '2026-10-24T11:30:00.000Z',
        },
      ],
    };

    /**
     * A atualização da org era só um ícone pequeno na sidebar: quem abria o plano não
     * sabia que a org tinha mexido nele.
     */
    it('says in the plan itself that the org changed it, and by whom', () => {
      useProStore.setState({ shares: [MOVED] });

      const { result } = renderHook(() => usePlanViewModel());

      expect(result.current.orgNotice).toBe('Bruno changed this plan in the org.');
      expect(result.current.orgUpdateLabel).toBe('Update');
    });

    it('says nothing when the org moved another workspace’s plan', () => {
      useProStore.setState({
        shares: [
          {
            ...MOVED,
            conflicts: MOVED.conflicts.map((one) => ({ ...one, workspaceId: 'w9' })),
          },
        ],
      });

      expect(renderHook(() => usePlanViewModel()).result.current.orgNotice).toBeNull();
    });
  });
});
