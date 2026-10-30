import { describe, expect, it } from 'vitest';
import { knownBugsOf } from '@/modules/Bug/library';
import { secondRun } from './fixtures';

describe('knownBugsOf', () => {
  it('tells a run each bug open by its id, title and where it was caught', () => {
    expect(knownBugsOf(secondRun().bugs)).toEqual([
      {
        id: 'BUG-01',
        title: 'Nothing happens on submit',
        caseId: 'TC-02',
        stepNumber: 2,
        isIncidental: false,
      },
    ]);
  });

  it('tells nothing when no bug is open', () => {
    expect(knownBugsOf([])).toEqual([]);
  });

  /**
   * O explorador perguntou de novo se o cartão sem campos era bug, minutos depois de o QA
   * dizer que não: o agente fica sabendo, marcado, para não abrir nem perguntar.
   */
  it('tells a run of a bug the QA said is none, marked as set aside', () => {
    expect(
      knownBugsOf(secondRun().bugs.map((bug) => ({ ...bug, isDismissed: true }))),
    ).toEqual([
      {
        id: 'BUG-01',
        title: 'Nothing happens on submit',
        caseId: 'TC-02',
        stepNumber: 2,
        isIncidental: false,
        isDismissed: true,
      },
    ]);
  });
});
