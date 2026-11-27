import type { IChangeBrief } from '@/shared/types';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { ChangeReader } from '@/main/classes/agents/ChangeReader';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { Harness } from '@ploomes/qazinho-harness';

/**
 * Uma história que mudou depois do plano, lida pelo Claude Code real (Haiku) do QA do
 * jeito que o "Propor as trocas" a entrega: o critério 3 passou de 3 para 5 tentativas, e
 * um comentário respondeu a dúvida D1. A troca tem de cair só no caso que cita o critério,
 * e a dúvida tem de sair respondida.
 */
const BRIEF: IChangeBrief = {
  changes: [
    {
      kind: 'story',
      key: 'SHOP-878',
      url: 'https://shop.atlassian.net/browse/SHOP-878',
      at: '2026-11-13T15:00:00.000Z',
      before: [
        'Cupom no checkout',
        'Acceptance criteria:',
        '- Um cupom válido aplica o desconto ao total',
        '- Um cupom vencido mostra um aviso e o total não muda',
        '- O campo bloqueia depois de 3 tentativas erradas',
      ].join('\n'),
      after: [
        'Cupom no checkout',
        'Acceptance criteria:',
        '- Um cupom válido aplica o desconto ao total',
        '- Um cupom vencido mostra um aviso e o total não muda',
        '- O campo bloqueia depois de 5 tentativas erradas',
      ].join('\n'),
      comments: [
        {
          author: 'Rui PO',
          at: '2026-11-13T15:10:00.000Z',
          text: 'D1: o aviso é "Este cupom venceu".',
        },
      ],
    },
  ],
  cases: [
    {
      id: 'TC-01',
      title: 'Cupom válido aplica o desconto',
      priority: 'P1',
      goal: '',
      preconditions: 'Um produto de R$ 100,00 no carrinho',
      steps: [{ action: 'Aplicar o cupom LOJA10', expected: 'O total mostra R$ 90,00' }],
      sources: ['C1'],
    },
    {
      id: 'TC-02',
      title: 'Cupom vencido mostra aviso',
      priority: 'P1',
      goal: '',
      preconditions: 'Um produto no carrinho',
      steps: [
        {
          action: 'Aplicar um cupom vencido',
          expected: 'Um aviso aparece e o total não muda',
        },
      ],
      sources: ['C2'],
      blockedBy: ['D1'],
    },
    {
      id: 'TC-03',
      title: 'Campo bloqueia depois das tentativas',
      priority: 'P2',
      goal: '',
      preconditions: 'Um produto no carrinho',
      steps: [
        { action: 'Errar o cupom 3 vezes', expected: 'O campo de cupom fica bloqueado' },
      ],
      sources: ['C3'],
    },
  ],
  doubts: [
    {
      id: 'D1',
      question: 'Qual é o texto do aviso de um cupom vencido?',
      sent: {
        url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=1',
        at: '2026-11-13T13:00:00.000Z',
      },
      answer: null,
    },
  ],
  language: 'pt',
};

describe('reading a change, with a real agent', () => {
  it('rewrites only the case that cites what changed, and takes the answer to the doubt', async () => {
    const command = (await new AgentDetector().detect()).find(
      (one) => one.id === 'claude-code',
    )?.path;

    expect(command, 'Claude Code must be installed for this suite').toBeDefined();

    const reader = new ChangeReader({
      runner: new AgentRunner({
        owners: new ProcessOwners(),
        folder: tmpdir(),
        onEvent: () => undefined,
      }),
      harness: new Harness(),
      findCommand: () => Promise.resolve(command ?? null),
    });
    const reading = await reader.read({
      workspaceId: 'w-watcher',
      agentId: 'claude-code',
      model: 'haiku',
      brief: BRIEF,
    });

    writeFileSync('/tmp/qz-watcher.json', JSON.stringify(reading, null, 2));

    if (!reading.isRead)
      throw new Error(`the agent did not read the change: ${reading.reason}`);

    const touched = reading.read.changes.map(({ caseId }) => caseId);
    const third = reading.read.changes.find(({ caseId }) => caseId === 'TC-03');

    expect(touched).toContain('TC-03');
    expect(touched).not.toContain('TC-01');
    expect(third?.case.steps.some(({ action }) => action.includes('5'))).toBe(true);
    expect(reading.read.answered.map(({ doubtId }) => doubtId)).toEqual(['D1']);
  }, 300_000);

  it('takes only the decisions of a meeting, and leaves the discussion out', async () => {
    const command = (await new AgentDetector().detect()).find(
      (one) => one.id === 'claude-code',
    )?.path;
    const reader = new ChangeReader({
      runner: new AgentRunner({
        owners: new ProcessOwners(),
        folder: tmpdir(),
        onEvent: () => undefined,
      }),
      harness: new Harness(),
      findCommand: () => Promise.resolve(command ?? null),
    });
    const reading = await reader.read({
      workspaceId: 'w-meeting',
      agentId: 'claude-code',
      model: 'haiku',
      brief: {
        ...BRIEF,
        doubts: [],
        changes: [
          {
            kind: 'meeting',
            name: 'alinhamento-cupons.vtt',
            at: '2026-11-12',
            text: [
              'Rui PO: Sobre o bloqueio do campo de cupom, fechamos em 5 tentativas erradas.',
              'Lia Dev: Combinado, 5.',
              'Ana QA: E se um dia for 10 tentativas? Talvez faça sentido para cliente antigo.',
              'Rui PO: Pode ser, mas isso não é para agora, vamos pensar depois.',
              'Lia Dev: Também pensei em mostrar um contador de tentativas, mas não decidimos nada.',
            ].join('\n'),
          },
        ],
      },
    });

    writeFileSync('/tmp/qz-meeting.json', JSON.stringify(reading, null, 2));

    if (!reading.isRead)
      throw new Error(`the agent did not read the meeting: ${reading.reason}`);

    const third = reading.read.changes.find(({ caseId }) => caseId === 'TC-03');

    expect(third?.case.steps.some(({ action }) => action.includes('5'))).toBe(true);
    expect(JSON.stringify(reading.read.changes)).not.toContain('10 tentativas');
    expect(reading.read.added.map(({ case: one }) => one.title).join(' ')).not.toMatch(
      /contador/i,
    );
  }, 300_000);
});
