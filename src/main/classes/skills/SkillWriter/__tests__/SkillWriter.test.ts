import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import type { IAgentTurn, IWriteSkill } from '@/shared/types';
import { describe, expect, it, vi } from 'vitest';
import { SkillWriter } from '@/main/classes/skills/SkillWriter';
import { Harness } from '@ploomes/qazinho-harness';

const ASK: IWriteSkill = {
  draftId: 'd1',
  agentId: 'claude-code',
  model: '',
  sessionId: null,
  text: 'Our cases are Gherkin.',
  current: null,
  language: 'pt',
};

const turnOf = (text: string): IAgentTurn => ({
  sessionId: 's1',
  text,
  usage: null,
  isError: false,
  costUsd: null,
});

/** Um agente falso que responde o que o teste manda, e guarda como foi chamado. */
function writer(props: { answer: string; files?: { name: string; isImage: boolean }[] }) {
  const asked: IRunAgent[] = [];
  const runner = {
    ask: vi.fn((request: IRunAgent) => {
      asked.push(request);

      return Promise.resolve(turnOf(props.answer));
    }),
    cancel: vi.fn(),
  };

  return {
    asked,
    runner,
    writer: new SkillWriter({
      runner,
      harness: new Harness(),
      library: {
        draftDir: (id) => `/data/skills/.drafts/${id}`,
        draftFiles: () => Promise.resolve(props.files ?? []),
      },
      findCommand: () => Promise.resolve('/bin/claude'),
    }),
  };
}

describe('SkillWriter', () => {
  it('hands back the skill the agent wrote, with the session for the next message', async () => {
    const { writer: one, asked } = writer({
      answer: JSON.stringify({
        reply: 'Pronto.',
        skill: {
          name: 'casos-gherkin',
          description: 'Ao escrever casos',
          body: '## Formato',
        },
      }),
    });

    expect(await one.ask(ASK)).toEqual({
      isAnswered: true,
      sessionId: 's1',
      answer: {
        reply: 'Pronto.',
        questions: [],
        skill: {
          name: 'casos-gherkin',
          description: 'Ao escrever casos',
          body: '## Formato',
        },
      },
    });
    expect(asked[0]).toMatchObject({
      workspaceId: '~skill/d1',
      prompt: 'Our cases are Gherkin.',
      tools: [],
      allowedTools: [],
    });
  });

  it('lets the agent read only the files the QA attached to the draft', async () => {
    const { writer: one, asked } = writer({
      answer: JSON.stringify({ reply: 'Lendo.' }),
      files: [{ name: 'cts.pdf', isImage: false }],
    });

    await one.ask(ASK);

    expect(asked[0]).toMatchObject({
      readDirs: ['/data/skills/.drafts/d1'],
      tools: ['Read', 'Grep', 'Glob'],
    });
    expect(asked[0]?.prompt).toContain(
      '- cts.pdf (file): /data/skills/.drafts/d1/cts.pdf',
    );
  });

  it('says why when the agent is missing, stopped, or answered something else', async () => {
    const missing = new SkillWriter({
      runner: { ask: vi.fn(), cancel: vi.fn() },
      harness: new Harness(),
      library: { draftDir: () => '', draftFiles: () => Promise.resolve([]) },
      findCommand: () => Promise.resolve(null),
    });

    expect(await missing.ask(ASK)).toMatchObject({
      isAnswered: false,
      reason: 'agent-missing',
    });
    expect(await writer({ answer: 'prose' }).writer.ask(ASK)).toMatchObject({
      isAnswered: false,
      reason: 'failed',
    });
    expect(
      await writer({ answer: '{}' }).writer.ask({ ...ASK, draftId: '../x' }),
    ).toMatchObject({
      isAnswered: false,
    });

    const { writer: one, runner } = writer({ answer: JSON.stringify({ reply: 'x' }) });
    const pending = one.ask(ASK);

    one.stop('d1');

    expect(await pending).toMatchObject({ isAnswered: false, reason: 'stopped' });
    expect(runner.cancel).toHaveBeenCalledWith('~skill/d1');
  });
});
