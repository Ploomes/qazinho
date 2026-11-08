import type { IMemoryKeeper } from '@/main/classes/agents/MemoryKeeper/types';
import type { IKeepMemories } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { MemoryKeeper } from '@/main/classes/agents/MemoryKeeper';

const REQUEST: IKeepMemories = {
  projectId: 'p-1',
  agentId: 'claude-code',
  model: 'opus',
  language: 'pt',
  memories: [{ id: 'm-1', text: 'Em Ajustes.', scope: 'project', target: 'all' }],
  events: [{ kind: 'said', text: 'Agora fica em Relatórios.' }],
};

const keeperWith = (props: {
  command?: string | null;
  text?: string;
  isError?: boolean;
  onAsk?: (asked: { model: string; workspaceId: string }) => void;
}) => {
  const fakes: IMemoryKeeper = {
    findCommand: () =>
      Promise.resolve(props.command === undefined ? 'claude' : props.command),
    harness: {
      keep: () => ({ systemPrompt: 'sys', prompt: 'p', schema: '{}' }),
      readKeep: ({ text }) => (text === 'ok' ? [{ op: 'delete', id: 'm-1' }] : null),
    },
    runner: {
      ask: (asked) => {
        props.onAsk?.(asked);

        return Promise.resolve({
          text: props.text ?? 'ok',
          isError: props.isError ?? false,
        } as Awaited<ReturnType<IMemoryKeeper['runner']['ask']>>);
      },
    },
  };

  return new MemoryKeeper(fakes);
};

describe('MemoryKeeper', () => {
  it('answers what the agent asked to change', async () => {
    await expect(keeperWith({}).keep(REQUEST)).resolves.toEqual({
      isKept: true,
      ops: [{ op: 'delete', id: 'm-1' }],
    });
  });

  it('asks the cheapest model of the agent, whatever the QA chose for the chat', async () => {
    let model = '';

    await keeperWith({
      onAsk: (asked) => {
        model = asked.model;
      },
    }).keep(REQUEST);

    expect(model).toBe('haiku');
  });

  it('keeps the chosen model when the agent names no cheaper one', async () => {
    let model = '';

    await keeperWith({
      onAsk: (asked) => {
        model = asked.model;
      },
    }).keep({ ...REQUEST, agentId: 'codex', model: 'gpt-5' });

    expect(model).toBe('gpt-5');
  });

  it('runs out of the chat, under a scope of its own', async () => {
    let scope = '';

    await keeperWith({
      onAsk: (asked) => {
        scope = asked.workspaceId;
      },
    }).keep(REQUEST);

    expect(scope).toBe('~memory/p-1');
  });

  it('keeps nothing without the agent, on an error or an unreadable answer', async () => {
    await expect(keeperWith({ command: null }).keep(REQUEST)).resolves.toEqual({
      isKept: false,
    });
    await expect(keeperWith({ isError: true }).keep(REQUEST)).resolves.toEqual({
      isKept: false,
    });
    await expect(keeperWith({ text: 'não sei' }).keep(REQUEST)).resolves.toEqual({
      isKept: false,
    });
  });
});
