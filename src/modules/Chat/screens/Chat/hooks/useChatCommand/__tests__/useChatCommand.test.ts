// @vitest-environment jsdom
import type { IProjectRepository } from '@/modules/Project/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useChatCommand } from '@/modules/Chat/screens/Chat/hooks/useChatCommand';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const WEB: IProjectRepository = {
  id: null,
  owner: 'acme',
  name: 'loja-web',
  baseBranch: 'develop',
};
const API: IProjectRepository = {
  id: null,
  owner: 'acme',
  name: 'loja-api',
  baseBranch: 'main',
};

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
  isJiraConnected?: boolean;
  isConfluenceOn?: boolean;
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
          isJiraConnected: props.isJiraConnected ?? true,
          isConfluenceOn: props.isConfluenceOn ?? true,
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
        {
          id: 'jira-plan',
          label: 'Plan from a Jira story',
          tag: '/jira',
          isDisabled: false,
        },
        {
          id: 'confluence-plan',
          label: 'Plan from a Confluence page',
          tag: '/confluence',
          isDisabled: false,
        },
        {
          id: 'figma-plan',
          label: 'Check against a Figma design',
          tag: '/figma',
          isDisabled: false,
        },
      ],
    });
    expect(command({ draft: '/code and more' }).result.current.picker).toBeNull();
  });

  describe('a plan against a Figma design', () => {
    const LINK = 'https://www.figma.com/design/AbC123/Shop-Checkout?node-id=12-345';

    it('takes the link the QA pastes, and plans against it with their words after', () => {
      const { result, rerender, onDraft } = command({ draft: '/' });

      act(() => {
        result.current.onPick('figma-plan');
      });

      expect(result.current.command).toMatchObject({
        isReady: false,
        placeholder: 'Paste the link to a frame or page in Figma',
      });

      rerender(LINK);

      expect(result.current.picker).toMatchObject({
        heading: 'Figma design',
        rows: [{ label: 'Shop Checkout', detail: 'frame 12:345' }],
        note: null,
      });

      act(() => {
        result.current.onPick(result.current.picker?.rows[0]?.id ?? '');
      });
      rerender('');

      expect(onDraft).toHaveBeenLastCalledWith('');
      expect(result.current.command).toMatchObject({
        isReady: true,
        parts: [
          { text: 'Shop Checkout', isStrong: true },
          { text: 'frame 12:345', isStrong: false },
        ],
      });
      expect(result.current.ask(' Only the cart. ')).toEqual({
        text: 'Plan the tests against the Figma design Shop Checkout.\n\nOnly the cart.',
        code: null,
        jira: null,
        confluence: null,
        design: {
          url: LINK,
          fileKey: 'AbC123',
          nodeId: '12:345',
          name: 'Shop Checkout',
        },
        command: { id: 'figma-plan', name: 'Shop Checkout', nodeId: '12:345', url: LINK },
      });
    });

    it('says what it pasted is not a Figma design, and offers nothing to pick', () => {
      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('figma-plan');
      });
      rerender('https://www.figma.com/board/AbC123/Flow');

      expect(result.current.picker).toMatchObject({
        rows: [],
        note: 'That is not a link to a Figma design.',
      });
      expect(result.current.ask('')).toBeNull();
    });

    it('goes back from the design to pasting another', () => {
      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('figma-plan');
      });
      rerender(LINK);
      act(() => {
        result.current.onPick(LINK);
      });
      rerender('');
      act(() => {
        result.current.onBack();
      });

      expect(result.current.command?.isReady).toBe(false);
      expect(result.current.picker?.heading).toBe('Figma design');
    });
  });

  it('narrows the commands by what follows the slash, in either language', () => {
    expect(
      command({ draft: '/codigo' }).result.current.picker?.rows.map(({ id }) => id),
    ).toEqual(['code-plan']);
    expect(
      command({ draft: '/historia' }).result.current.picker?.rows.map(({ id }) => id),
    ).toEqual(['jira-plan']);
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

  /** Each command needs its own tracker: Jira missing must not lock the plan from the code. */
  it('locks only the command whose tracker is missing', () => {
    const rows = command({ draft: '/', isJiraConnected: false, isConfluenceOn: false })
      .result.current.picker?.rows;

    expect(rows?.map(({ id, isDisabled, detail }) => [id, isDisabled, detail])).toEqual([
      [
        'code-plan',
        false,
        'The agent reads a branch of a repository and plans its tests with you.',
      ],
      ['jira-plan', true, 'Connect Jira in Settings → Integrations first.'],
      [
        'confluence-plan',
        true,
        'Turn Confluence on beside Jira in Settings → Integrations first.',
      ],
      [
        'figma-plan',
        false,
        'The agent reads the design through your Figma, plans with you, and each run holds the screens to it.',
      ],
    ]);
  });

  describe('onPick', () => {
    it('skips the repository step when the project has one, and lists its branches, the base first', async () => {
      const { result, onDraft, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('code-plan');
      });
      rerender('');

      expect(onDraft).toHaveBeenCalledWith('');
      expect(result.current.command).toEqual({
        name: 'Plan from the code',
        parts: [{ key: 'acme/loja-web', text: 'acme/loja-web', isStrong: false }],
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

      expect(result.current.command?.parts.map(({ text }) => text)).toEqual([
        'acme/loja-api',
      ]);
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
        jira: null,
        confluence: null,
        design: null,
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

      expect(result.current.command?.parts.map(({ text }) => text)).toEqual([
        'acme/loja-web',
      ]);

      act(() => {
        result.current.onBack();
      });

      expect(result.current.command?.parts).toEqual([]);

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

  describe('a plan from a Jira story', () => {
    const STORIES = {
      isListed: true as const,
      issues: [
        {
          key: 'SHOP-12',
          summary: 'Aplicar cupom',
          url: 'https://acme.atlassian.net/browse/SHOP-12',
        },
        {
          key: 'SHOP-14',
          summary: 'Frete grátis',
          url: 'https://acme.atlassian.net/browse/SHOP-14',
        },
      ],
    };

    function pickingStory(draft = '') {
      const searchJira = vi.fn().mockResolvedValue(STORIES);

      window.qazinho = { ...window.qazinho, searchJira };

      const picking = command({ draft: '/' });

      act(() => {
        picking.result.current.onPick('jira-plan');
      });
      picking.rerender(draft);

      return { ...picking, searchJira };
    }

    it('lists the stories the QA opened last before they type anything', async () => {
      const { result, searchJira } = pickingStory();

      await waitFor(() => {
        expect(result.current.picker?.rows.map(({ id, detail }) => [id, detail])).toEqual(
          [
            ['SHOP-12', 'Aplicar cupom'],
            ['SHOP-14', 'Frete grátis'],
          ],
        );
      });
      expect(searchJira).toHaveBeenCalledWith('');
      expect(result.current.picker?.heading).toBe('the stories you opened last');
      expect(result.current.command).toMatchObject({
        name: 'Plan from a Jira story',
        parts: [],
        placeholder: 'Which story? Type its key or words from it',
      });
    });

    it('searches Jira for what the QA types, once they stop typing', async () => {
      const { result, rerender, searchJira } = pickingStory();

      rerender('cup');
      rerender('cupom');

      expect(result.current.picker?.note).toBe('Searching Jira…');

      await waitFor(() => {
        expect(searchJira).toHaveBeenCalledWith('cupom');
      });
      expect(searchJira).not.toHaveBeenCalledWith('cup');
      await waitFor(() => {
        expect(result.current.picker?.note).toBeNull();
      });
      expect(result.current.picker?.heading).toBe('Jira story');
    });

    it('plans from the story picked, with the QA words after', async () => {
      const { result } = pickingStory();

      await waitFor(() => {
        expect(result.current.picker?.rows.length).toBe(2);
      });
      act(() => {
        result.current.onPick('SHOP-12');
      });

      expect(result.current.command).toMatchObject({
        isReady: true,
        parts: [
          { text: 'SHOP-12', isStrong: true },
          { text: 'Aplicar cupom', isStrong: false },
        ],
      });
      expect(result.current.ask(' Only the web. ')).toEqual({
        text: 'Plan the tests for the Jira story SHOP-12: Aplicar cupom.\n\nOnly the web.',
        code: null,
        jira: { key: 'SHOP-12' },
        confluence: null,
        design: null,
        command: {
          id: 'jira-plan',
          key: 'SHOP-12',
          summary: 'Aplicar cupom',
          url: 'https://acme.atlassian.net/browse/SHOP-12',
        },
      });
    });

    it('does NOT plan before a story is picked, and steps back to the list', async () => {
      const { result } = pickingStory();

      expect(result.current.ask('')).toBeNull();

      await waitFor(() => {
        expect(result.current.picker?.rows.length).toBe(2);
      });
      act(() => {
        result.current.onPick('SHOP-14');
      });
      act(() => {
        result.current.onBack();
      });

      expect(result.current.command?.isReady).toBe(false);

      act(() => {
        result.current.onBack();
      });

      expect(result.current.command).toBeNull();
    });

    it('says why Jira would not search', async () => {
      window.qazinho = {
        ...window.qazinho,
        searchJira: vi
          .fn()
          .mockResolvedValue({ isListed: false, failure: 'unauthorized' }),
      };

      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('jira-plan');
      });
      rerender('');

      await waitFor(() => {
        expect(result.current.picker?.note).toBe(
          'Jira refused the token. Connect Jira again in Settings → Integrations.',
        );
      });
    });
  });

  describe('a plan from a Confluence page', () => {
    const PAGES = {
      isListed: true as const,
      pages: [
        {
          id: '98304',
          title: 'Checkout: cenários',
          space: 'QA',
          url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
        },
        {
          id: '98305',
          title: 'Frete: regras',
          space: '',
          url: 'https://acme.atlassian.net/wiki/pages/98305',
        },
      ],
    };

    function pickingPage() {
      const searchConfluence = vi.fn().mockResolvedValue(PAGES);

      window.qazinho = { ...window.qazinho, searchConfluence };

      const picking = command({ draft: '/' });

      act(() => {
        picking.result.current.onPick('confluence-plan');
      });
      picking.rerender('');

      return { ...picking, searchConfluence };
    }

    it('lists the pages the QA worked on last, then searches what they type', async () => {
      const { result, rerender, searchConfluence } = pickingPage();

      await waitFor(() => {
        expect(result.current.picker?.rows.map(({ label, tag }) => [label, tag])).toEqual(
          [
            ['Checkout: cenários', 'QA'],
            ['Frete: regras', null],
          ],
        );
      });
      expect(searchConfluence).toHaveBeenCalledWith('');
      expect(result.current.picker?.heading).toBe('the pages you worked on last');

      rerender('checkout');

      expect(result.current.picker?.note).toBe('Searching Confluence…');
      await waitFor(() => {
        expect(searchConfluence).toHaveBeenCalledWith('checkout');
      });
    });

    it('plans from the page picked, with the QA words after', async () => {
      const { result } = pickingPage();

      expect(result.current.ask('')).toBeNull();

      await waitFor(() => {
        expect(result.current.picker?.rows.length).toBe(2);
      });
      act(() => {
        result.current.onPick('98304');
      });

      expect(result.current.command).toMatchObject({
        isReady: true,
        parts: [
          { text: 'Checkout: cenários', isStrong: true },
          { text: 'QA', isStrong: false },
        ],
      });
      expect(result.current.ask('Only the coupon.')).toEqual({
        text: 'Plan the tests from the Confluence page “Checkout: cenários”.\n\nOnly the coupon.',
        code: null,
        jira: null,
        confluence: { pageId: '98304' },
        design: null,
        command: {
          id: 'confluence-plan',
          pageId: '98304',
          title: 'Checkout: cenários',
          space: 'QA',
          url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
        },
      });

      act(() => {
        result.current.onBack();
      });

      expect(result.current.command?.isReady).toBe(false);
    });

    it('says why Confluence would not search', async () => {
      window.qazinho = {
        ...window.qazinho,
        searchConfluence: vi
          .fn()
          .mockResolvedValue({ isListed: false, failure: 'not-connected' }),
      };

      const { result, rerender } = command({ draft: '/' });

      act(() => {
        result.current.onPick('confluence-plan');
      });
      rerender('');

      await waitFor(() => {
        expect(result.current.picker?.note).toBe(
          'Confluence is off. Turn it on beside Jira in Settings → Integrations.',
        );
      });
    });
  });
});
