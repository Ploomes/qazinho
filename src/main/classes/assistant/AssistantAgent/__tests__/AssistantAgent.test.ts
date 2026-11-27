import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import type { AppToolCall, IAgentTurn, IAppSnapshot } from '@/shared/types';
import type { IAttachApp } from '@ploomes/qazinho-harness';
import { describe, expect, it } from 'vitest';
import { AssistantAgent } from '@/main/classes/assistant/AssistantAgent';
import { ASSISTANT_WAIT } from '@/shared/constants';

const APP: IAppSnapshot = {
  screen: 'home',
  openWorkspaceId: null,
  openTab: null,
  openRunId: null,
  openBugId: null,
  language: 'pt',
  theme: 'night',
  runAlert: 'system',
  agent: 'Claude Code',
  integrations: [],
  projects: [],
  workspaces: [],
};

const ANSWERED: IAgentTurn = {
  sessionId: 's-1',
  text: 'Pronto.',
  usage: null,
  isError: false,
  costUsd: 0.01,
};

/**
 * Todo colaborador como um fake: um agente que joga cada turno que recebe, que pode
 * chamar as ferramentas do app servidas a ele como um agente real faz por MCP, um host
 * que as serve, um harness que anota o que lhe disseram, e uma página que faz o que lhe
 * pedem.
 */
function desk(props: {
  turns: ((app: IAttachApp | null) => Promise<IAgentTurn>)[];
  command?: string | null;
}) {
  const asked: IRunAgent[] = [];
  const told: Record<string, string>[] = [];
  const acted: AppToolCall[] = [];
  const cancelled: string[] = [];
  const detached: string[] = [];
  let served: IAttachApp | null = null;
  let dropped = 0;

  const assistant = new AssistantAgent({
    runner: {
      ask: (run) => {
        asked.push(run);

        const turn = props.turns.shift();

        return turn === undefined ? Promise.resolve(ANSWERED) : turn(served);
      },
      cancel: (scope) => {
        cancelled.push(scope);
      },
    },
    tools: {
      attachApp: (app) => {
        served = app;
      },
      detachApp: (scope) => {
        detached.push(scope);
        served = null;
      },
      mcpConfigFor: (scope, toolTimeoutMs) => JSON.stringify({ scope, toolTimeoutMs }),
    },
    harness: {
      assistant: (message) => {
        told.push(message.told);

        return {
          systemPrompt: 'SYSTEM',
          prompt: `PROMPT ${message.text}`,
          told: { 'On screen': message.text },
          tools: { groups: ['app'], allowedTools: ['mcp__qazinho'] },
        };
      },
    },
    bridge: {
      act: (call) => {
        acted.push(call);

        return Promise.resolve({ text: 'Done on screen.', isError: false });
      },
      dropAll: () => {
        dropped += 1;
      },
    },
    findCommand: () =>
      Promise.resolve(props.command === undefined ? '/bin/claude' : props.command),
    kindOf: () => Promise.resolve(null),
    home: '/Users/qa',
  });

  return {
    assistant,
    asked,
    told,
    acted,
    cancelled,
    detached,
    served: () => served,
    dropped: () => dropped,
  };
}

const ask = (text: string, sessionId: string | null = null) => ({
  agentId: 'claude-code',
  model: 'haiku',
  sessionId,
  text,
  app: APP,
});

describe('AssistantAgent', () => {
  describe('ask', () => {
    it('asks the agent with the app tools served for the turn, and takes them away after', async () => {
      const room = desk({
        turns: [
          async (app) => {
            const done = await app?.perform({ name: 'go_home', args: {} });

            return { ...ANSWERED, text: done?.text ?? '' };
          },
        ],
      });

      expect(await room.assistant.ask(ask('Volta pro início'))).toEqual({
        ...ANSWERED,
        text: 'Done on screen.',
        failure: null,
      });
      expect(room.asked[0]).toMatchObject({
        workspaceId: '~assistant',
        command: '/bin/claude',
        model: 'haiku',
        sessionId: null,
        prompt: 'PROMPT Volta pro início',
        systemPrompt: 'SYSTEM',
        allowedTools: ['mcp__qazinho'],
        mcpConfig: JSON.stringify({
          scope: '~assistant',
          toolTimeoutMs: ASSISTANT_WAIT.toolMs,
        }),
      });
      expect(room.acted).toEqual([{ name: 'go_home', args: {} }]);
      expect(room.detached).toEqual(['~assistant']);
      expect(room.served()).toBeNull();
    });

    it('does NOT hand the page a build that is not on disk', async () => {
      const room = desk({
        turns: [
          async (app) => {
            const done = await app?.perform({
              name: 'create_project',
              args: { name: 'Loja', android: '~/gone.apk' },
            });

            return { ...ANSWERED, text: done?.text ?? '' };
          },
        ],
      });

      expect((await room.assistant.ask(ask('Cria a Loja'))).text).toBe(
        'There is no .apk at /Users/qa/gone.apk.',
      );
      expect(room.acted).toEqual([]);
    });

    it('says the agent is missing, and serves nothing', async () => {
      const room = desk({ turns: [], command: null });

      expect(await room.assistant.ask(ask('Oi'))).toMatchObject({
        isError: true,
        failure: { reason: 'agent-missing', agentId: 'claude-code' },
      });
      expect(room.asked).toEqual([]);
      expect(room.detached).toEqual([]);
    });

    it('tells a resumed session only what it has not read yet', async () => {
      const room = desk({ turns: [] });

      await room.assistant.ask(ask('Oi'));
      await room.assistant.ask(ask('E agora?', 's-1'));

      expect(room.told).toEqual([{}, { 'On screen': 'Oi' }]);
    });

    it('starts the conversation again when the agent lost its session', async () => {
      const room = desk({
        turns: [
          () =>
            Promise.resolve({
              ...ANSWERED,
              isError: true,
              text: 'No conversation found with session ID: s-0',
            }),
        ],
      });

      expect(await room.assistant.ask(ask('Oi', 's-0'))).toMatchObject({
        isError: false,
        failure: null,
      });
      expect(room.asked.map(({ sessionId }) => sessionId)).toEqual(['s-0', null]);
    });

    it('answers one message at a time', async () => {
      let finish: (turn: IAgentTurn) => void = () => undefined;
      const room = desk({
        turns: [
          () =>
            new Promise<IAgentTurn>((settle) => {
              finish = settle;
            }),
        ],
      });
      const first = room.assistant.ask(ask('Oi'));

      expect(await room.assistant.ask(ask('Oi de novo'))).toMatchObject({
        failure: { reason: 'other', said: 'The assistant is still answering.' },
      });

      finish(ANSWERED);

      expect(await first).toMatchObject({ failure: null });
    });
  });

  describe('stop', () => {
    it('interrupts the turn, lets go of the page, and says it was stopped', async () => {
      let finish: (turn: IAgentTurn) => void = () => undefined;
      const room = desk({
        turns: [
          () =>
            new Promise<IAgentTurn>((settle) => {
              finish = settle;
            }),
        ],
      });
      const asking = room.assistant.ask(ask('Apaga tudo'));

      await Promise.resolve();
      await Promise.resolve();
      room.assistant.stop();
      finish({ ...ANSWERED, isError: true, text: '' });

      expect(await asking).toMatchObject({
        isError: true,
        failure: { reason: 'stopped' },
      });
      expect(room.cancelled).toEqual(['~assistant']);
      expect(room.dropped()).toBe(1);
    });

    it('does nothing when the assistant is not answering', () => {
      const room = desk({ turns: [] });

      room.assistant.stop();

      expect(room.cancelled).toEqual([]);
      expect(room.dropped()).toBe(0);
    });
  });
});
