import type { IProSyncBug, IProSyncRun } from '@/shared/types';

/** A run of two steps: the first passed on its recording, the second failed with a screen. */
export const RUN: IProSyncRun = {
  workspaceId: 'w1',
  runId: 'r1',
  kind: 'run',
  startedAt: '2026-10-24T10:00:00.000Z',
  durationSec: 92,
  endedBy: 'finished',
  target: { kind: 'web', label: 'staging', value: 'https://staging.loja.dev' },
  counts: { passed: 1, failed: 1, blocked: 0, skipped: 0 },
  cases: [
    {
      id: 'c1',
      title: 'Pagar com Pix',
      verdict: 'failed',
      durationSec: 92,
      steps: [
        {
          number: 1,
          action: 'Abrir o carrinho',
          verdict: 'passed',
          why: null,
          bugId: null,
          shotFile: null,
          by: 'replay',
          proof: 'Carrinho',
          span: null,
        },
        {
          number: 2,
          action: 'Copiar o código Pix',
          verdict: 'failed',
          why: 'O botão não apareceu',
          bugId: 'b1',
          shotFile: '/data/runs/w1/r1/2.jpg',
          by: 'agent',
          proof: null,
          span: null,
        },
      ],
    },
  ],
  videoStartedAt: null,
  costUsd: 0.04,
};

/** A bug seen in that run and once more, filed in Jira. */
export const BUG: IProSyncBug = {
  workspaceId: 'w1',
  bugId: 'b1',
  severity: 'high',
  title: 'O código Pix não aparece',
  body: 'O botão de copiar some.',
  expected: 'O botão Copiar código aparece',
  got: 'Nada aparece',
  caseId: 'c1',
  caseTitle: 'Pagar com Pix',
  stepNumber: 2,
  target: 'https://staging.loja.dev',
  isIncidental: false,
  isDismissed: false,
  filed: {
    tracker: 'jira',
    key: 'LOJA-12',
    url: 'https://loja.atlassian.net/browse/LOJA-12',
    at: '2026-10-24T11:00:00.000Z',
  },
  repro: [
    { action: 'Abrir o carrinho', isBad: false },
    { action: 'Copiar o código Pix', isBad: true },
  ],
  shots: [
    { file: '/data/runs/w1/r1/2.jpg', isBad: true },
    { file: null, isBad: false },
  ],
  sightings: [
    {
      runId: 'r2',
      runWhen: '2026-10-25T10:00:00.000Z',
      caseId: 'c1',
      stepNumber: 2,
      shotFile: '/data/runs/w1/r2/2.jpg',
      at: 12.5,
    },
  ],
  firstSeenAt: '2026-10-24T10:01:00.000Z',
};
