// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBugSendModalViewModel } from '@/modules/Bug/screens/Bugs/components/BugSendModal/hooks';
import { recordedRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

const STORY = {
  key: 'SHOP-12',
  title: 'Aplicar cupom',
  source: 'jira' as const,
  url: 'https://acme.atlassian.net/browse/SHOP-12',
};
const WORKSPACE = { ...recordedRun(), issue: STORY };
const BUG = WORKSPACE.bugs[0]!;
const PROJECT: IProject = {
  id: 'p1',
  name: 'Loja',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://shop.test/' }],
  repositories: [{ id: '201', owner: 'acme', name: 'shop', baseBranch: 'main' }],
};
const CONNECTED_AT = '2026-10-20T09:00:00.000Z';
const BOTH = [
  { id: 'github' as const, account: 'octoqa', site: null, connectedAt: CONNECTED_AT },
  {
    id: 'jira' as const,
    account: 'Ana QA',
    site: 'https://acme.atlassian.net',
    connectedAt: CONNECTED_AT,
  },
];

function modal(project: IProject = PROJECT) {
  useAppStore.setState({ projects: [project], screen: 'workspace' });

  const onSend = vi.fn();
  const onCancel = vi.fn();
  const rendered = renderHook(() =>
    useBugSendModalViewModel({ workspaceId: WORKSPACE.id, bug: BUG, onSend, onCancel }),
  );

  return { ...rendered, onSend, onCancel };
}

beforeEach(() => {
  useSetupStore.setState({ integrations: BOTH });
  useWorkspaceStore.setState({ workspaces: [WORKSPACE] });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listJiraProjects: vi.fn().mockResolvedValue({
      isListed: true,
      projects: [
        { key: 'SHOP', name: 'Loja' },
        { key: 'OPS', name: 'Operações' },
      ],
    }),
    listRepositories: vi.fn().mockResolvedValue({
      isListed: true,
      repositories: [
        {
          id: '103',
          owner: 'acme',
          name: 'api',
          isPrivate: true,
          defaultBranch: 'main',
          pushedAt: null,
          description: 'The API',
        },
      ],
    }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBugSendModalViewModel', () => {
  describe('picked', () => {
    it('suggests the Jira project of the story the workspace works from, named as Jira lists it', async () => {
      const { result } = modal();

      expect(result.current.picked).toMatchObject({ label: 'SHOP', detail: 'SHOP' });

      await waitFor(() => {
        expect(result.current.picked).toMatchObject({ label: 'Loja', detail: 'SHOP' });
      });
      expect(result.current.confirmLabel).toBe('Send to Jira');
    });

    it('suggests where the project’s last bug went over the story', () => {
      const { result } = modal({
        ...PROJECT,
        issueTarget: { tracker: 'github', owner: 'acme', name: 'web' },
      });

      expect(result.current.picked).toMatchObject({ label: 'acme/web' });
      expect(result.current.confirmLabel).toBe('Send to GitHub');
    });

    it('suggests the project’s first repository once the QA turns to GitHub', () => {
      const { result } = modal();

      act(() => {
        result.current.trackers.find(({ id }) => id === 'github')?.onClick();
      });

      expect(result.current.picked).toMatchObject({ label: 'acme/shop' });
      expect(result.current.githubNote).not.toBeNull();
    });
  });

  describe('onPick', () => {
    it('lists Jira’s projects once the QA picks another, and takes the one picked', async () => {
      const { result } = modal();

      act(() => {
        result.current.onClearPicked();
      });

      expect(result.current.picked).toBeNull();
      await waitFor(() => {
        expect(result.current.search.items.map(({ id }) => id)).toEqual(['SHOP', 'OPS']);
      });
      expect(result.current.search.isAutoFocused).toBe(true);

      act(() => {
        result.current.onPick('OPS');
      });

      expect(result.current.picked).toMatchObject({ label: 'Operações', detail: 'OPS' });
    });

    it('lists the QA’s other repositories after the project’s own', async () => {
      const { result } = modal();

      act(() => {
        result.current.trackers.find(({ id }) => id === 'github')?.onClick();
      });
      act(() => {
        result.current.onClearPicked();
      });

      await waitFor(() => {
        expect(result.current.search.items.map(({ id }) => id)).toEqual([
          'acme/shop',
          'acme/api',
        ]);
      });

      act(() => {
        result.current.onPick('acme/api');
      });

      expect(result.current.picked).toMatchObject({ label: 'acme/api' });
    });
  });

  describe('onConfirm', () => {
    it('sends the bug where it was picked, with the title the QA left', () => {
      const { result, onSend } = modal();

      act(() => {
        result.current.onTitle('  Coupon EXPIRED accepted ');
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tracker: 'jira', project: 'SHOP' },
          title: 'Coupon EXPIRED accepted',
        }),
      );
    });

    it('does NOT send without a place to send to, or without a title', () => {
      const { result, onSend } = modal();

      act(() => {
        result.current.onTitle(' ');
      });

      expect(result.current.canConfirm).toBe(false);

      act(() => {
        result.current.onTitle('Coupon');
        result.current.onClearPicked();
      });

      expect(result.current.canConfirm).toBe(false);

      act(() => {
        result.current.onConfirm();
      });

      expect(onSend).not.toHaveBeenCalled();
    });

    it('opens the integrations when no tracker is connected yet', () => {
      useSetupStore.setState({ integrations: [] });

      const { result, onCancel } = modal();

      expect(result.current.isConnected).toBe(false);
      expect(result.current.confirmLabel).toBe('Open integrations');

      act(() => {
        result.current.onConfirm();
      });

      expect(useSettingsStore.getState().tab).toBe('integrations');
      expect(useAppStore.getState().screen).toBe('settings');
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(useAssistantStore.getState().tip?.text).toBe(
        'Connect Jira or GitHub here, then send the bug again.',
      );
    });
  });

  describe('goes', () => {
    it('tells what goes to Jira: the words, the screens, a clip and the link to the story', () => {
      const { result } = modal();

      expect(result.current.goes.map(({ key }) => key)).toEqual([
        'text',
        'shots',
        'video',
        'story',
      ]);
    });

    it('tells GitHub gets only the words', () => {
      const { result } = modal();

      act(() => {
        result.current.trackers.find(({ id }) => id === 'github')?.onClick();
      });

      expect(result.current.goes.map(({ key }) => key)).toEqual(['text']);
    });
  });
});
