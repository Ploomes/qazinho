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
      onAnswerQuestions: vi.fn(),
      onOpenPlan: vi.fn(),
      onTakeSuggestion: vi.fn(),
      onVariables: vi.fn(),
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

  it('marks what the coding agent in the QA editor wrote, with a word on where it came from', () => {
    expect(
      row({ id: 'm-1', kind: 'user', at: '09:41', text: 'Plan it', from: 'agent' }),
    ).toMatchObject({
      who: 'Your coding agent',
      isFromAgent: true,
      fromAgentTitle: 'Sent by the coding agent in your editor',
    });
    expect(
      row({
        id: 'm-1',
        kind: 'user',
        at: '09:41',
        text: 'Plan it',
        from: 'agent',
        caller: 'claude-code',
      }).who,
    ).toBe('Claude Code');
    expect(row({ id: 'm-1', kind: 'user', at: '09:41', text: 'hi' }).isFromAgent).toBe(
      false,
    );
  });

  it('titles a plan card by its cases and steps, one of each in the singular', () => {
    expect(
      row({ id: 'm-4', kind: 'plan', at: '09:41', caseCount: 1, stepCount: 1 }).planTitle,
    ).toBe('Plan written: 1 case, 1 step');
    expect(
      row({ id: 'm-5', kind: 'plan', at: '09:41', caseCount: 3, stepCount: 9 }).planTitle,
    ).toBe('Plan written: 3 cases, 9 steps');
  });

  it('does NOT put a name on what QAzinho itself wrote', () => {
    expect(
      row({
        id: 'm-3',
        kind: 'error',
        at: '09:41',
        runId: null,
        text: 'x',
        detail: null,
        fix: null,
      }).who,
    ).toBe('');
  });

  it('slides in only what arrived while the chat was open', () => {
    const message: ChatMessage = { id: 'm-1', kind: 'user', at: '09:41', text: 'hi' };

    expect(row(message, { isNew: true }).initial).toEqual({ opacity: 0, y: 10 });
    expect(row(message).initial).toBe(false);
  });

  it('puts the QA on the right and the agent on the left, with the face of the agent', () => {
    expect(row({ id: 'm-1', kind: 'user', at: '09:41', text: 'hi' })).toMatchObject({
      className: 'chat-row chat-row--user',
      hasFace: false,
    });
    expect(
      row({ id: 'm-2', kind: 'agent', at: '09:41', who: 'Claude Code', text: 'ok' }),
    ).toMatchObject({ className: 'chat-row chat-row--agent', hasFace: true });
  });

  it('keeps "you" for a screen reader only, since the side already says it', () => {
    expect(row({ id: 'm-1', kind: 'user', at: '09:41', text: 'hi' }).whoClassName).toBe(
      'chat-row__who chat-row__who--unseen',
    );
  });

  it('sets apart what the coding agent wrote from what the QA wrote', () => {
    expect(
      row({ id: 'm-1', kind: 'user', at: '09:41', text: 'Plan it', from: 'agent' }),
    ).toMatchObject({
      className: 'chat-row chat-row--outside',
      whoClassName: 'chat-row__who',
    });
  });

  it('shows no name over a card, nor over a reply the same agent goes on with', () => {
    expect(
      row({ id: 'm-4', kind: 'plan', at: '09:41', caseCount: 1, stepCount: 1 }),
    ).toMatchObject({ className: 'chat-row chat-row--card', hasHead: false });
    expect(
      row(
        { id: 'm-2', kind: 'agent', at: '09:41', who: 'Claude Code', text: 'ok' },
        { isFollowUp: true },
      ).hasHead,
    ).toBe(false);
    expect(
      row({ id: 'm-2', kind: 'agent', at: '09:41', who: 'Claude Code', text: 'ok' })
        .hasHead,
    ).toBe(true);
  });

  it('marks a row that sits inside a run', () => {
    const message: ChatMessage = { id: 'm-1', kind: 'user', at: '09:41', text: 'hi' };

    expect(row(message, { isNested: true }).className).toBe(
      'chat-row chat-row--user chat-row--nested',
    );
  });
});
