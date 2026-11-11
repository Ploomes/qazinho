import type { IRun, IRunStep } from '@/modules/Run/types';
import { describe, expect, it } from 'vitest';
import { lastRunGlanceOf } from '@/modules/Device/library/lastRunGlanceOf';

const stepOf = (over: Partial<IRunStep>): IRunStep => ({
  number: 1,
  action: 'Abrir o carrinho',
  verdict: 'passed',
  why: null,
  bugId: null,
  shot: null,
  shotFile: null,
  span: null,
  ...over,
});

const runOf = (cases: IRun['cases']): IRun => ({
  id: 'r-04',
  meta: 'Cupom',
  startedAt: '19:46',
  durationSec: 924,
  costUsd: null,
  counts: { passed: 0, failed: 0, blocked: 0, skipped: 0 },
  endedBy: 'finished',
  video: null,
  cases,
});

describe('lastRunGlanceOf', () => {
  it('shows the screen of the last step that failed, over a later passing one', () => {
    const glance = lastRunGlanceOf(
      runOf([
        {
          id: 'TC-02',
          title: 'Cupom soma uma vez',
          verdict: 'failed',
          durationSec: 10,
          steps: [
            stepOf({ number: 1, shot: 'a.jpg' }),
            stepOf({
              number: 2,
              verdict: 'failed',
              shotFile: '/runs/b.jpg',
              bugId: 'BUG-01',
            }),
          ],
        },
        {
          id: 'TC-03',
          title: 'Cupom vencido',
          verdict: 'passed',
          durationSec: 10,
          steps: [stepOf({ number: 1, shot: 'c.jpg' })],
        },
      ]),
    );

    expect(glance.shot).toEqual({
      src: null,
      file: '/runs/b.jpg',
      caseId: 'TC-02',
      number: 2,
      isBad: true,
    });
  });

  it('falls back to the last screen when nothing failed', () => {
    const glance = lastRunGlanceOf(
      runOf([
        {
          id: 'TC-01',
          title: 'Aplicar cupom',
          verdict: 'passed',
          durationSec: 10,
          steps: [
            stepOf({ number: 1, shot: 'a.jpg' }),
            stepOf({ number: 2, shot: 'b.jpg' }),
          ],
        },
      ]),
    );

    expect(glance.shot?.src).toBe('b.jpg');
    expect(glance.shot?.isBad).toBe(false);
    expect(glance.failed).toEqual([]);
  });

  it('has no screen when no step kept one', () => {
    expect(
      lastRunGlanceOf(
        runOf([
          {
            id: 'TC-01',
            title: 'x',
            verdict: 'passed',
            durationSec: 1,
            steps: [stepOf({})],
          },
        ]),
      ).shot,
    ).toBeNull();
  });

  it('lists the cases that did not pass, each with its bug', () => {
    const glance = lastRunGlanceOf(
      runOf([
        {
          id: 'TC-02',
          title: 'Cupom soma uma vez',
          verdict: 'failed',
          durationSec: 10,
          steps: [stepOf({ verdict: 'failed', bugId: 'BUG-01' })],
        },
        {
          id: 'TC-05',
          title: 'Frete',
          verdict: 'blocked',
          durationSec: 10,
          steps: [stepOf({ verdict: 'blocked' })],
        },
      ]),
    );

    expect(glance.failed).toEqual([
      { id: 'TC-02', title: 'Cupom soma uma vez', bugId: 'BUG-01' },
      { id: 'TC-05', title: 'Frete', bugId: null },
    ]);
  });
});
