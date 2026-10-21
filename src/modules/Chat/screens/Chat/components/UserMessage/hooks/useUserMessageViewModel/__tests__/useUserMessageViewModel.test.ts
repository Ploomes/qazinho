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
        repository: 'acme/loja-web',
        branch: 'feat/cupom',
      },
    });
  });

  it('shows no command on a plain message', () => {
    expect(
      renderHook(() => useUserMessageViewModel({ message: message('hi') })).result
        .current,
    ).toMatchObject({ hasText: true, command: null });
  });
});
