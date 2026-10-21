// @vitest-environment jsdom
import type { IBuildFromCodeProps } from '@/modules/Project/components/ProjectModal/components/BuildFromCode/types';
import type { IStartBuild } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useBuildFromCodeViewModel } from '@/modules/Project/components/ProjectModal/components/BuildFromCode/hooks/useBuildFromCodeViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useBuildStore } from '@/store';

const REPOSITORIES = [
  { owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
  { owner: 'acme', name: 'loja-app', baseBranch: 'main' },
];

/** A bridge that lists two branches per repository and remembers each build asked for. */
function bridge() {
  const started: IStartBuild[] = [];

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listBranches: (repository) =>
      Promise.resolve({
        isListed: true,
        branches: [
          {
            name: repository.name === 'loja-app' ? 'main' : 'develop',
            isDefault: true,
            pullRequest: null,
            movedAt: null,
          },
          {
            name: 'feat/cupom',
            isDefault: false,
            pullRequest: { number: 42, title: 'Cupom' },
            movedAt: null,
          },
        ],
      }),
    startBuild: (build) => {
      started.push(build);

      return new Promise(() => undefined);
    },
  };

  return { started };
}

function picker(overrides: Partial<IBuildFromCodeProps> = {}) {
  const onStart = vi.fn();
  const onReset = vi.fn();
  const rendered = renderHook(() =>
    useBuildFromCodeViewModel({
      platform: 'android',
      projectId: 'p1',
      repositories: REPOSITORIES,
      buildId: null,
      onStart,
      onReset,
      ...overrides,
    }),
  );

  return { ...rendered, onStart, onReset };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useBuildStore.setState({ builds: [] });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBuildFromCodeViewModel', () => {
  describe('onOpen', () => {
    it('opens on the first repository and its base branch, and lists its branches', async () => {
      bridge();

      const { result } = picker();

      act(() => {
        result.current.onOpen();
      });

      expect(result.current).toMatchObject({
        isPicking: true,
        branchLabel: 'From develop',
      });
      await waitFor(() => {
        expect(result.current.rows.map(({ label, tag }) => [label, tag])).toEqual([
          ['develop', 'base'],
          ['feat/cupom', null],
        ]);
      });
    });
  });

  describe('onPickBranch', () => {
    it('builds the branch picked, from the repository picked, for the project', async () => {
      const { started } = bridge();
      const { result, onStart } = picker();

      act(() => {
        result.current.onOpen();
      });
      act(() => {
        result.current.repositories[1]?.onPick();
      });
      await waitFor(() => {
        expect(result.current.rows).toHaveLength(2);
      });
      act(() => {
        result.current.onPickBranch('feat/cupom');
      });
      act(() => {
        result.current.onStart();
      });

      expect(started[0]).toMatchObject({
        projectId: 'p1',
        platform: 'android',
        repository: { owner: 'acme', name: 'loja-app' },
        branch: 'feat/cupom',
      });
      expect(onStart).toHaveBeenCalledWith(started[0]?.buildId);
      expect(result.current.isPicking).toBe(false);
    });
  });

  describe('onStart', () => {
    it('does NOT build with no repository to build from', () => {
      const { started } = bridge();
      const { result, onStart } = picker({ repositories: [] });

      act(() => {
        result.current.onStart();
      });

      expect(started).toEqual([]);
      expect(onStart).not.toHaveBeenCalled();
      expect(result.current.canStart).toBe(false);
    });
  });

  it('narrows the branches as the QA types, and offers no repository choice with one', async () => {
    bridge();

    const { result } = picker({ repositories: [REPOSITORIES[1]!] });

    act(() => {
      result.current.onOpen();
    });
    await waitFor(() => {
      expect(result.current.rows).toHaveLength(2);
    });
    act(() => {
      result.current.onQuery('cupom');
    });

    expect(result.current.rows.map(({ id }) => id)).toEqual(['feat/cupom']);
    expect(result.current.repositories).toEqual([]);
  });

  it('shows the build once there is one', () => {
    bridge();

    expect(picker({ buildId: 'b1' }).result.current).toMatchObject({
      isBuilding: true,
      buildId: 'b1',
    });
  });
});
