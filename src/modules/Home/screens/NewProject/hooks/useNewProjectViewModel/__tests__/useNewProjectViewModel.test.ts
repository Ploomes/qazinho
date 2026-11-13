// @vitest-environment jsdom
import type { IAskAgent } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewProjectViewModel } from '@/modules/Home/screens/NewProject/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const STORY = {
  key: 'SHOP-892',
  summary: 'Frete grátis acima de R$ 200',
  url: 'https://acme.atlassian.net/browse/SHOP-892',
};

/** Uma bridge cujo agente nunca termina, e que diz o que lhe pediram. */
function bridge(over: Partial<ReturnType<typeof fakeQazinhoApi>> = {}) {
  const asked = vi.fn((_ask: IAskAgent) => new Promise<never>(() => undefined));

  window.qazinho = { ...fakeQazinhoApi('darwin'), askAgent: asked, ...over };

  return { asked };
}

const toggle = (
  result: { current: ReturnType<typeof useNewProjectViewModel> },
  id: string,
) => {
  act(() => {
    result.current.pick.cards.find((card) => card.id === id)?.onToggle();
  });
};

beforeEach(() => {
  useAppStore.setState({
    projects: [{ id: 'p-old', name: 'Blog', targets: [], repositories: [] }],
    screen: 'newProject',
    selectedWorkspaceId: null,
    pendingImport: null,
  });
  useWorkspaceStore.setState({ workspaces: [], askingIds: [] });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useNewProjectViewModel', () => {
  describe('the cards', () => {
    it('starts with nothing picked and Continue off', () => {
      bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      expect(result.current.pick).toMatchObject({
        countLabel: 'Nothing picked',
        canContinue: false,
      });
      expect(result.current.pick.cards.map(({ id }) => id)).toEqual([
        'web',
        'build',
        'code',
        'tests',
        'story',
        'design',
      ]);
    });

    it('picks several, counting them, and dims them all for "nothing"', () => {
      bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      toggle(result, 'web');
      toggle(result, 'story');

      expect(result.current.pick.countLabel).toBe('2 picked');
      expect(result.current.pick.cards[0]).toMatchObject({ isOn: true, opacity: 1 });

      act(() => {
        result.current.pick.none.onToggle();
      });

      expect(result.current.pick).toMatchObject({ countLabel: 'Starting from scratch' });
      expect(
        result.current.pick.cards.every(({ isOn, opacity }) => !isOn && opacity < 1),
      ).toBe(true);
    });

    it('goes to one field per picked card, and back with them kept', () => {
      bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      toggle(result, 'story');
      toggle(result, 'web');
      act(() => {
        result.current.pick.onContinue();
      });

      expect(result.current).toMatchObject({ isFill: true, direction: 1 });
      expect(result.current.fill.fields.map(({ key }) => key)).toEqual(['web', 'story']);

      act(() => {
        result.current.fill.onBack();
      });

      expect(result.current).toMatchObject({ isPick: true, direction: -1 });
      expect(result.current.pick.countLabel).toBe('2 picked');
    });

    it('cancels back to where the QA was, and with Esc too', () => {
      bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(useAppStore.getState().screen).toBe('welcome');
      expect(result.current.isPick).toBe(true);
    });
  });

  describe('the fields', () => {
    it('names the project by the site, says what is missing, and holds Create until it is all there', () => {
      bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      toggle(result, 'web');
      toggle(result, 'story');
      act(() => {
        result.current.pick.onContinue();
      });
      act(() => {
        result.current.fill.onWeb('https://staging.loja.dev');
      });

      expect(result.current.fill).toMatchObject({
        name: 'Loja',
        hasMissing: true,
        missingText: 'Still missing: the story',
        canCreate: false,
      });

      act(() => {
        result.current.fill.onStory({ kind: 'jira', issue: STORY });
      });

      expect(result.current.fill).toMatchObject({ hasMissing: false, canCreate: true });
    });

    it('creates the project, opens the story plan in its chat and asks the agent', () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      toggle(result, 'web');
      toggle(result, 'story');
      act(() => {
        result.current.pick.onContinue();
      });
      act(() => {
        result.current.fill.onWeb('staging.loja.dev');
        result.current.fill.onStory({ kind: 'jira', issue: STORY });
        result.current.fill.onName('Loja Online');
      });
      act(() => {
        result.current.fill.onCreate();
      });

      const project = useAppStore.getState().projects.at(-1);
      const [workspace] = useWorkspaceStore.getState().workspaces;

      expect(project).toMatchObject({
        name: 'Loja Online',
        targets: [{ kind: 'web', value: 'https://staging.loja.dev' }],
      });
      expect(workspace).toMatchObject({
        projectId: project?.id,
        issue: { key: 'SHOP-892' },
      });
      expect(useAppStore.getState()).toMatchObject({
        screen: 'workspace',
        selectedWorkspaceId: workspace?.id,
        modal: null,
      });
      expect(asked.mock.calls[0]?.[0]).toMatchObject({
        workspaceId: workspace?.id,
        jira: { key: 'SHOP-892' },
      });
    });

    it('does NOT create without a name', () => {
      bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      toggle(result, 'build');
      act(() => {
        result.current.pick.onContinue();
      });
      act(() => {
        result.current.fill.onBuilds([{ kind: 'android', path: '/b/loja.apk' }]);
        result.current.fill.onName('  ');
      });

      expect(result.current.fill.canCreate).toBe(false);

      act(() => {
        result.current.fill.onCreate();
      });

      expect(useAppStore.getState().projects).toHaveLength(1);
    });
  });

  describe('with nothing', () => {
    it('opens the example shop and starts exploring it', async () => {
      const startRun = vi.fn(() => Promise.resolve());

      bridge({
        exampleShop: () => Promise.resolve('http://127.0.0.1:47821/?lang=en'),
        startRun,
      });
      const { result } = renderHook(() => useNewProjectViewModel());

      act(() => {
        result.current.pick.none.onToggle();
      });
      act(() => {
        result.current.pick.onContinue();
      });

      expect(result.current.isNothingStep).toBe(true);

      act(() => {
        result.current.nothing.onStart();
      });

      await waitFor(() => {
        expect(useAppStore.getState().projects.at(-1)).toMatchObject({
          name: 'Example shop',
          targets: [{ value: 'http://127.0.0.1:47821/?lang=en' }],
        });
      });
      await waitFor(() => {
        expect(startRun).toHaveBeenCalled();
      });
    });

    it('says the shop did not open, and creates nothing', async () => {
      bridge({ exampleShop: () => Promise.resolve(null) });
      const { result } = renderHook(() => useNewProjectViewModel());

      act(() => {
        result.current.pick.none.onToggle();
      });
      act(() => {
        result.current.pick.onContinue();
      });
      act(() => {
        result.current.nothing.onStart();
      });

      await waitFor(() => {
        expect(result.current.nothing.failure).toBe(
          'The example shop did not open on this computer.',
        );
      });
      expect(useAppStore.getState().projects).toHaveLength(1);
    });

    it('plans before the app from what the QA wrote, only once there is something', () => {
      const { asked } = bridge();
      const { result } = renderHook(() => useNewProjectViewModel());

      act(() => {
        result.current.pick.none.onToggle();
      });
      act(() => {
        result.current.pick.onContinue();
      });
      act(() => {
        result.current.nothing.ways[1]?.onPick();
      });

      expect(result.current.nothing).toMatchObject({ isIdea: true, canStart: false });

      act(() => {
        result.current.nothing.onIdea('O cupom de primeira compra');
      });
      act(() => {
        result.current.nothing.onStart();
      });

      return waitFor(() => {
        expect(asked.mock.calls[0]?.[0]).toMatchObject({
          text: 'O cupom de primeira compra',
        });
        expect(useAppStore.getState().projects.at(-1)).toMatchObject({
          name: 'New app',
          targets: [],
        });
      });
    });
  });
});
