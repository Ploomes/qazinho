// @vitest-environment jsdom
import type { IProjectRepository } from '@/modules/Project/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useChatCommand } from '@/modules/Chat/screens/Chat/hooks/useChatCommand';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const WEB: IProjectRepository = {
  owner: 'acme',
  name: 'loja-web',
  baseBranch: 'develop',
};
const API: IProjectRepository = { owner: 'acme', name: 'loja-api', baseBranch: 'main' };

beforeEach(async () => {
  await i18n.changeLanguage('en');
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listBranches: vi.fn().mockResolvedValue({
      isListed: true,
      branches: [
        {
          name: 'feat/cupom',
          isDefault: false,
          pullRequest: { number: 42, title: 'Cupom no checkout' },
          movedAt: '2026-10-20T10:00:00Z',
        },
        { name: 'develop', isDefault: true, pullRequest: null, movedAt: null },
        { name: 'fix/frete', isDefault: false, pullRequest: null, movedAt: null },
      ],
    }),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

function command(props: {
  draft?: string;
  repositories?: IProjectRepository[];
  isGithubConnected?: boolean;
}) {
  const onDraft = vi.fn();

  return {
    onDraft,
    ...renderHook(
      (draft: string) =>
        useChatCommand({
          draft,
          repositories: props.repositories ?? [WEB],
          isGithubConnected: props.isGithubConnected ?? true,
          onDraft,
        }),
      { initialProps: props.draft ?? '' },
    ),
  };
}

describe('useChatCommand', () => {
  it('offers the commands once the draft opens with a slash, and not before', () => {
    expect(command({ draft: 'plan the' }).result.current.picker).toBeNull();
    expect(command({ draft: '/' }).result.current.picker).toMatchObject({
      heading: 'commands',
      rows: [
        { id: 'code-plan', label: 'Plan from the code', tag: '/code', isDisabled: false },
      ],
    });
    expect(command({ draft: '/code and more' }).result.current.picker).toBeNull();
  });

  it('narrows the commands by what follows the slash, in either language', () => {
    expect(command({ draft: '/plano' }).result.current.picker?.rows).toHaveLength(1);
    expect(command({ draft: '/zzz' }).result.current.picker).toMatchObject({
      rows: [],
      note: 'Nothing matches “zzz”.',
    });
  });

  it('does NOT let the QA pick the command before GitHub and the repositories are there', () => {
    const offline = command({ draft: '/', isGithubConnected: false });

    expect(offline.result.current.picker?.rows[0]).toMatchObject({
      isDisabled: true,
      detail: 'Connect GitHub in Settings → Integrations first.',
    });

    act(() => {
      offline.result.current.onPick('code-plan');
    });

    expect(offline.result.current.command).toBeNull();
    expect(
      command({ draft: '/', repositories: [] }).result.current.picker?.rows[0]?.detail,
    ).toBe("Add this project's repositories in its settings first.");
  });

  describe('onPick', () => {
    it('skips the repository step when the project has one, and lists its branches, the base first', async () => {
      const { result, onDraft, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('');

      expect(onDraft).toHaveBeenCalledWith('');
      expect(result.current.command).toMatchObject({
        name: 'Plan from the code',
        repository: 'acme/loja-web',
        branch: null,
        isReady: false,
        placeholder: 'Which branch? Type to search',
      });
      expect(result.current.picker?.note).toBe('Reading the branches…');

      await waitFor(() => {
        expect(result.current.picker?.rows.map(({ id }) => id)).toEqual([
          'develop',
          'feat/cupom',
          'fix/frete',
        ]);
      });
      expect(result.current.picker?.heading).toBe('branch of acme/loja-web');
      expect(result.current.picker?.rows[0]?.tag).toBe('the whole app');
      expect(result.current.picker?.rows[1]?.detail).toBe('#42 Cupom no checkout');
    });

    it('asks for the repository first when the project has more than one', () => {
      const { result, rerender } = command({ draft: '/', repositories: [WEB, API] });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('');

      expect(result.current.picker).toMatchObject({
        heading: 'repository',
        rows: [
          { id: 'acme/loja-web', detail: 'base develop' },
          { id: 'acme/loja-api', detail: 'base main' },
        ],
      });

      act(() => {
        result.current.onPick('acme/loja-api');
      });

      expect(result.current.command?.repository).toBe('acme/loja-api');
      expect(window.qazinho.listBranches).toHaveBeenCalledWith({
        owner: 'acme',
        name: 'loja-api',
      });
    });

    it('narrows the branches by the draft, title of their pull request included', async () => {
      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('checkout');

      await waitFor(() => {
        expect(result.current.picker?.rows.map(({ id }) => id)).toEqual(['feat/cupom']);
      });
    });
  });

  describe('ask', () => {
    it('plans what a branch changed, with the QA words after, once the branch is picked', async () => {
      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('');
      await waitFor(() => {
        expect(result.current.picker?.rows.length).toBeGreaterThan(0);
      });

      expect(result.current.ask('')).toBeNull();

      act(() => {
        result.current.onPick('feat/cupom');
      });

      expect(result.current.command?.isReady).toBe(true);
      expect(result.current.picker).toBeNull();
      expect(result.current.ask('  Focus on the checkout. ')).toEqual({
        text: 'Plan the tests for what branch feat/cupom of acme/loja-web changed against develop.\n\nFocus on the checkout.',
        code: { owner: 'acme', name: 'loja-web', base: 'develop', branch: 'feat/cupom' },
        command: {
          id: 'code-plan',
          repository: 'acme/loja-web',
          branch: 'feat/cupom',
          base: 'develop',
        },
      });
    });

    it('plans the whole app when the branch picked is the base', async () => {
      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('');
      await waitFor(() => {
        expect(result.current.picker?.rows.length).toBeGreaterThan(0);
      });
      act(() => {
        result.current.onPick('develop');
      });

      expect(result.current.ask('')?.text).toBe(
        'Plan the tests for the whole app, from the code of acme/loja-web on develop.',
      );
    });
  });

  describe('onBack', () => {
    it('steps back one choice at a time, then lets go of the command', () => {
      const { result, rerender } = command({ draft: '/', repositories: [WEB, API] });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('');
      act(() => {
        result.current.onPick('acme/loja-web');
      });
      act(() => {
        result.current.onPick('feat/cupom');
      });
      act(() => {
        result.current.onBack();
      });

      expect(result.current.command).toMatchObject({
        repository: 'acme/loja-web',
        branch: null,
      });

      act(() => {
        result.current.onBack();
      });

      expect(result.current.command).toMatchObject({ repository: null });

      act(() => {
        result.current.onBack();
      });

      expect(result.current.command).toBeNull();
    });

    it("lets go of the command at once when the project's one repository was picked for the QA", () => {
      const { result } = command({ draft: '/' });

      act(() => {
        result.current.onPick('code-plan');
      });
      act(() => {
        result.current.onBack();
      });

      expect(result.current.command).toBeNull();
    });
  });

  it('says why GitHub would not list the branches', async () => {
    window.qazinho.listBranches = vi
      .fn()
      .mockResolvedValue({ isListed: false, failure: 'denied' });

    const { result } = command({ draft: '/' });

    act(() => {
      result.current.onPick('code-plan');
    });

    await waitFor(() => {
      expect(result.current.picker?.note).toBe(
        'GitHub refused it: this account may lack access, or its organization asks for SSO.',
      );
    });
  });
});
