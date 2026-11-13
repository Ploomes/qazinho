import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import type { IChangeReader } from '@/main/classes/agents/ChangeReader/types';
import type { IReadChange } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { ChangeReader } from '@/main/classes/agents/ChangeReader';

const READ = { summary: 'Mudou.', changes: [], added: [], doubts: [], answered: [] };

const REQUEST: IReadChange = {
  workspaceId: 'w1',
  agentId: 'claude-code',
  model: 'opus',
  brief: { changes: [], cases: [], doubts: [], language: 'pt' },
};

const readerWith = (props: {
  command?: string | null;
  text?: string;
  isError?: boolean;
  onAsk?: (asked: IRunAgent) => void;
}) => {
  const fakes: IChangeReader = {
    findCommand: () =>
      Promise.resolve(props.command === undefined ? 'claude' : props.command),
    harness: {
      readChange: () => ({ systemPrompt: 'sys', prompt: 'p', schema: '{}' }),
      readChangeAnswer: ({ text }) => (text === 'ok' ? READ : null),
    },
    runner: {
      ask: (asked) => {
        props.onAsk?.(asked);

        return Promise.resolve({
          text: props.text ?? 'ok',
          isError: props.isError ?? false,
        } as Awaited<ReturnType<IChangeReader['runner']['ask']>>);
      },
    },
  };

  return new ChangeReader(fakes);
};

describe('ChangeReader', () => {
  it('hands back what the agent proposed for the change', async () => {
    await expect(readerWith({}).read(REQUEST)).resolves.toEqual({
      isRead: true,
      read: READ,
    });
  });

  /** O que ele lê veio da história e do código, então ele não tem ferramenta nenhuma. */
  it('asks the cheapest model, sealed, with no tools, apart from the chat', async () => {
    let asked: IRunAgent | null = null;

    await readerWith({
      onAsk: (one) => {
        asked = one;
      },
    }).read(REQUEST);

    expect(asked).toEqual(
      expect.objectContaining({
        model: 'haiku',
        workspaceId: '~change/w1',
        isSealed: true,
        allowedTools: [],
      }),
    );
  });

  it('says the agent is missing, or that it did not answer', async () => {
    await expect(readerWith({ command: null }).read(REQUEST)).resolves.toEqual({
      isRead: false,
      reason: 'agent-missing',
    });
    await expect(readerWith({ isError: true }).read(REQUEST)).resolves.toEqual({
      isRead: false,
      reason: 'unanswered',
    });
    await expect(readerWith({ text: 'prose' }).read(REQUEST)).resolves.toEqual({
      isRead: false,
      reason: 'unanswered',
    });
  });
});
