// @vitest-environment jsdom
import type { IChatRowProps } from '@/modules/Chat/screens/Chat/components/ChatRow/types';
import type { ChatMessage } from '@/modules/Chat/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChatRowViewModel } from '@/modules/Chat/screens/Chat/components/ChatRow/hooks/useChatRowViewModel';

const row = (message: ChatMessage, props: Partial<IChatRowProps> = {}) =>
  renderHook(() =>
    useChatRowViewModel({
      message,
      isNew: false,
      isAnswerable: false,
      onAnswer: vi.fn(),
      onAnswerQuestions: vi.fn(),
      onOpenPlan: vi.fn(),
      onOpenBug: vi.fn(),
      ...props,
    }),
  ).result.current;

describe('useChatRowViewModel', () => {
  it('names the QA as "you", and the agent by its name, a note of a run included', () => {
    expect(row({ id: 'm-1', kind: 'user', at: '09:41', text: 'hi' }).who).toBe('You');
    expect(
      row({
        id: 'm-2',
        kind: 'note',
        at: '09:41',
        runId: 'r-01',
        who: 'Codex',
        text: 'x',
      }),
    ).toMatchObject({ who: 'Codex', whoClassName: 'chat-row__who chat-row__who--agent' });
  });

  it('does NOT put a name on what QAzinho itself wrote', () => {
    expect(
      row({ id: 'm-3', kind: 'error', at: '09:41', runId: null, text: 'x', fix: null })
        .who,
    ).toBe('');
  });

  it('slides in only what arrived while the chat was open', () => {
    const message: ChatMessage = { id: 'm-1', kind: 'user', at: '09:41', text: 'hi' };

    expect(row(message, { isNew: true }).initial).toEqual({ opacity: 0, y: 10 });
    expect(row(message).initial).toBe(false);
  });

  it('reads as a log line inside a run, and as a chat row everywhere else', () => {
    const message: ChatMessage = { id: 'm-1', kind: 'user', at: '09:41', text: 'hi' };

    expect(row(message, { isNested: true }).className).toBe('chat-row chat-row--nested');
    expect(row(message).className).toBe('chat-row');
  });
});
