// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUserMessageViewModel } from '@/modules/Chat/screens/Chat/components/UserMessage/hooks/useUserMessageViewModel';

function message(text: string, mentions?: string[]) {
  return { id: 'm-1', kind: 'user' as const, at: '19:54', text, mentions };
}

describe('useUserMessageViewModel', () => {
  it('sets the mentions the message was sent with apart from the text', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: message('what broke in @r-02?', ['r-02']) }),
    );

    expect(result.current.parts.map(({ text, isMention }) => [text, isMention])).toEqual([
      ['what broke in ', false],
      ['@r-02', true],
      ['?', false],
    ]);
  });

  it('does NOT highlight an @ that pointed at nothing', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: message('mail me @home', []) }),
    );

    expect(result.current.parts).toMatchObject([
      { text: 'mail me @home', isMention: false },
    ]);
  });

  it('reads a message saved before mentions existed as plain text', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: message('hello') }),
    );

    expect(result.current.parts).toMatchObject([{ text: 'hello', isMention: false }]);
  });

  it('keys each part apart, even when the same mention repeats', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: message('@r-02 vs @r-02', ['r-02']) }),
    );
    const keys = result.current.parts.map(({ key }) => key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('shows the command a message carried, and no empty words under it', async () => {
    const { i18n } = await import('@/languages');

    await i18n.changeLanguage('en');

    const { result } = renderHook(() =>
      useUserMessageViewModel({
        message: {
          ...message(''),
          command: {
            id: 'code-plan',
            repository: 'acme/loja-web',
            branch: 'feat/cupom',
            base: 'develop',
          },
        },
      }),
    );

    expect(result.current).toMatchObject({
      hasText: false,
      command: {
        name: 'Plan from the code',
        parts: [
          { text: 'acme/loja-web', className: 'user-message__command-part' },
          {
            text: 'feat/cupom',
            className: 'user-message__command-part user-message__command-part--strong',
          },
        ],
      },
    });
  });

  it('shows the Jira story a message planned from, its key standing out', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({
        message: {
          ...message(''),
          command: {
            id: 'jira-plan',
            key: 'SHOP-12',
            summary: 'Aplicar cupom',
            url: 'https://acme.atlassian.net/browse/SHOP-12',
          },
        },
      }),
    );

    expect(result.current.command).toMatchObject({
      name: 'Plan from a Jira story',
      parts: [
        {
          text: 'SHOP-12',
          className: 'user-message__command-part user-message__command-part--strong',
        },
        { text: 'Aplicar cupom', className: 'user-message__command-part' },
      ],
    });
  });

  it('shows the Confluence page a plan comes from, with its space when it has one', () => {
    const sent = (space: string) =>
      renderHook(() =>
        useUserMessageViewModel({
          message: {
            ...message(''),
            command: {
              id: 'confluence-plan',
              pageId: '98304',
              title: 'Checkout: cenários',
              space,
              url: 'https://acme.atlassian.net/wiki/spaces/QA/pages/98304',
            },
          },
        }),
      ).result.current.command?.parts.map(({ text }) => text);

    expect(sent('QA')).toEqual(['Checkout: cenários', 'QA']);
    expect(sent('')).toEqual(['Checkout: cenários']);
  });

  it('shows the Figma design a plan is checked against, and the frame its link names', () => {
    const sent = (nodeId: string | null) =>
      renderHook(() =>
        useUserMessageViewModel({
          message: {
            ...message(''),
            command: {
              id: 'figma-plan',
              name: 'Shop',
              nodeId,
              url: 'https://www.figma.com/design/AbC123/Shop',
            },
          },
        }),
      ).result.current.command;

    expect(sent('12:345')).toMatchObject({
      name: 'Check against a Figma design',
      parts: [{ text: 'Shop' }, { text: 'frame 12:345' }],
    });
    expect(sent(null)?.parts[1]?.text).toBe('the whole file');
  });

  it('shows no command on a plain message', () => {
    expect(
      renderHook(() => useUserMessageViewModel({ message: message('hi') })).result
        .current,
    ).toMatchObject({ hasText: true, markdown: null, command: null });
  });

  it("renders the coding agent's message as Markdown, since it writes lists and bold", () => {
    const text = '**Sources:**\n- Jira story HC-1682\n- Figma prototype';
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: { ...message(text), from: 'agent' } }),
    );

    expect(result.current).toMatchObject({ hasText: false, markdown: text });
  });

  it("does NOT read the QA's own words as Markdown", () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: message('2 * 3 = 6') }),
    );

    expect(result.current).toMatchObject({ hasText: true, markdown: null });
  });

  it('shows no empty Markdown block when the agent sent only a command', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({ message: { ...message(''), from: 'agent' } }),
    );

    expect(result.current.markdown).toBeNull();
  });

  it('shows an image the QA attached by its preview, and a file by its name', () => {
    const { result } = renderHook(() =>
      useUserMessageViewModel({
        message: {
          ...message('look at this'),
          attachments: [
            {
              id: 'a1',
              name: 'erro.png',
              file: 'a1-erro.png',
              kind: 'image',
              size: 3,
              preview: 'data:image/jpeg;base64,x',
            },
            {
              id: 'a2',
              name: 'proposta.pdf',
              file: 'a2-proposta.pdf',
              kind: 'file',
              size: 4,
              preview: null,
            },
          ],
        },
      }),
    );

    expect(result.current.attachments).toEqual([
      { key: 'a1', name: 'erro.png', preview: 'data:image/jpeg;base64,x' },
      { key: 'a2', name: 'proposta.pdf', preview: null },
    ]);
  });
});
