import type { IRecipeBook } from '@/main/classes/runs/RunCoordinator/types';
import type { IFlatStep } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { developsACase } from '@/main/classes/runs/RunCoordinator/library';
import { fingerprintOf } from '@ploomes/qazinho-harness/engine';

const stepOf = (caseId: string): IFlatStep => ({
  caseId,
  caseTitle: caseId,
  casePriority: 'P1',
  caseGoal: '',
  casePreconditions: '',
  numberInCase: 1,
  action: `Abrir ${caseId}`,
  expected: 'Certo',
});
const target = { kind: 'web' as const, value: 'http://app.test' };
const steps = [stepOf('TC-01'), stepOf('TC-02')];
const recipeOf = (step: IFlatStep) => ({
  caseId: step.caseId,
  fingerprint: fingerprintOf({ targetKind: 'web', steps: [step] }),
  targetKind: 'web' as const,
  steps: [{ number: 1, actions: [], proof: 'Certo' }],
  runId: 'r-01',
  recordedAt: 0,
});
const firstRecorded: IRecipeBook = { cases: [recipeOf(steps[0] as IFlatStep)] };
const allRecorded: IRecipeBook = { cases: steps.map(recipeOf) };

describe('developsACase', () => {
  /** O agente pensa por minutos: o vídeo ficava enorme, e lento, sem mostrar nada de útil. */
  it('is a development when a case has no recording yet', () => {
    expect(developsACase({ run: { steps, target }, book: firstRecorded })).toBe(true);
    expect(developsACase({ run: { steps, target }, book: { cases: [] } })).toBe(true);
  });

  it('is not one when every case only walks its recording', () => {
    expect(developsACase({ run: { steps, target }, book: allRecorded })).toBe(false);
  });

  it('looks only at the cases the run was asked to walk', () => {
    expect(
      developsACase({
        run: { steps, target, caseIds: ['TC-01'] },
        book: firstRecorded,
      }),
    ).toBe(false);
    expect(
      developsACase({
        run: { steps, target, caseIds: ['TC-02'] },
        book: firstRecorded,
      }),
    ).toBe(true);
  });

  it('counts a run all with the agent, whatever is recorded', () => {
    expect(
      developsACase({ run: { steps, target, mode: 'agent' }, book: allRecorded }),
    ).toBe(true);
  });

  it('never counts an exploration', () => {
    expect(
      developsACase({ run: { steps: [], target, mode: 'explore' }, book: { cases: [] } }),
    ).toBe(false);
  });

  it('says a recording that no longer matches its case still has to be developed', () => {
    const changed = { ...stepOf('TC-01'), expected: 'Outra coisa' };

    expect(
      developsACase({ run: { steps: [changed], target }, book: firstRecorded }),
    ).toBe(true);
  });
});
