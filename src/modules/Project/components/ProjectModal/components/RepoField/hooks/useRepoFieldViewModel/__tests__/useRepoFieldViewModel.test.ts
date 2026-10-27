// @vitest-environment jsdom
import type { IProjectRepository } from '@/modules/Project/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRepoFieldViewModel } from '@/modules/Project/components/ProjectModal/components/RepoField/hooks/useRepoFieldViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore, useSetupStore } from '@/store';

const GITHUB = {
  id: 'github' as const,
  account: 'octoqa',
  site: null,
  connectedAt: '2026-10-20T09:00:00.000Z',
};

const REPOSITORIES = [
  {
    id: '104',
    owner: 'acme',
    name: 'loja-web',
    isPrivate: true,
    defaultBranch: 'develop',
    pushedAt: '2026-10-19T10:00:00Z',
    description: 'A loja na web',
  },
  {
    id: '105',
    owner: 'acme',
    name: 'loja-api',
    isPrivate: false,
    defaultBranch: 'main',
    pushedAt: '2026-10-18T10:00:00Z',
    description: null,
  },
];

beforeEach(() => {
  useSettingsStore.setState({ language: 'en' });
  useSetupStore.setState({ integrations: [GITHUB], installs: {} });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listRepositories: vi
      .fn()
      .mockResolvedValue({ isListed: true, repositories: REPOSITORIES }),
    listBranches: vi.fn().mockResolvedValue({
      isListed: true,
      branches: [
        { name: 'develop', isDefault: true, pullRequest: null, movedAt: null },
        {
          name: 'release/1.4',
          isDefault: false,
          pullRequest: { number: 12, title: 'Release 1.4' },
          movedAt: '2026-10-19T10:00:00Z',
        },
      ],
    }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

function field(repositories: IProjectRepository[] = []) {
  const onChange = vi.fn();

  return {
    onChange,
    ...renderHook(() => useRepoFieldViewModel({ repositories, onChange })),
  };
}

describe('useRepoFieldViewModel', () => {
  it('locks the field behind connecting GitHub, and lists nothing until then', () => {
    useSetupStore.setState({ integrations: [] });

    const { result } = field();

    expect(result.current.lock).toMatchObject({
      reason: 'Connect GitHub to pick the repositories this project is made of',
      setUp: { label: 'Connect GitHub' },
    });
    expect(window.qazinho.listRepositories).not.toHaveBeenCalled();
  });

  it("offers the QA's repositories that are not in the project yet", async () => {
    const { result } = field([
      { id: '105', owner: 'acme', name: 'loja-api', baseBranch: 'main' },
    ]);

    expect(result.current.search.note).toBe('Reading your repositories…');

    await waitFor(() => {
      expect(result.current.search.items).toEqual([
        {
          id: 'acme/loja-web',
          label: 'acme/loja-web',
          tag: 'private',
          detail: 'A loja na web',
        },
      ]);
    });
    expect(result.current.search.note).toBeNull();
  });

  describe('onAdd', () => {
    it('adds a repository with its GitHub id and its own default branch as the base', async () => {
      const { result, onChange } = field();

      await waitFor(() => {
        expect(result.current.search.items).toHaveLength(2);
      });
      act(() => {
        result.current.onAdd('acme/loja-web');
      });

      expect(onChange).toHaveBeenCalledWith([
        { id: '104', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      ]);
    });

    it('does NOT add a repository twice, nor one GitHub did not list', async () => {
      const { result, onChange } = field([
        { id: '104', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      ]);

      await waitFor(() => {
        expect(result.current.search.note).toBeNull();
      });
      act(() => {
        result.current.onAdd('acme/loja-web');
        result.current.onAdd('acme/secret');
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('onRemove', () => {
    it('takes a repository out of the project', () => {
      const { result, onChange } = field([
        { id: '104', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
        { id: '105', owner: 'acme', name: 'loja-api', baseBranch: 'main' },
      ]);

      act(() => {
        result.current.onRemove('acme/loja-web');
      });

      expect(onChange).toHaveBeenCalledWith([
        { id: '105', owner: 'acme', name: 'loja-api', baseBranch: 'main' },
      ]);
    });
  });

  describe('onBase', () => {
    it("opens a repository's branches and sets the one picked as its base", async () => {
      const { result, onChange } = field([
        { id: '104', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      ]);

      act(() => {
        result.current.onBase('acme/loja-web');
      });

      expect(result.current.rows[0]?.isBasing).toBe(true);
      expect(window.qazinho.listBranches).toHaveBeenCalledWith({
        owner: 'acme',
        name: 'loja-web',
      });

      await waitFor(() => {
        expect(result.current.branchSearch.items.map(({ id }) => id)).toEqual([
          'develop',
          'release/1.4',
        ]);
      });
      expect(result.current.branchSearch.items[1]?.detail).toBe('#12 Release 1.4');

      act(() => {
        result.current.onPickBase('release/1.4');
      });

      expect(onChange).toHaveBeenCalledWith([
        { id: '104', owner: 'acme', name: 'loja-web', baseBranch: 'release/1.4' },
      ]);
      expect(result.current.rows[0]?.isBasing).toBe(false);
    });

    it('closes the branches when the same repository is clicked again', () => {
      const { result } = field([
        { id: '104', owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
      ]);

      act(() => {
        result.current.onBase('acme/loja-web');
      });
      act(() => {
        result.current.onBase('acme/loja-web');
      });

      expect(result.current.rows[0]?.isBasing).toBe(false);
    });
  });

  it('says why GitHub did not list the repositories', async () => {
    window.qazinho.listRepositories = vi
      .fn()
      .mockResolvedValue({ isListed: false, failure: 'unreachable' });

    const { result } = field();

    await waitFor(() => {
      expect(result.current.search.note).toBe(
        'GitHub is out of reach from this machine. Check the network.',
      );
    });
  });
});
