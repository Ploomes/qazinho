import { describe, expect, it } from 'vitest';
import { mergeCases } from '@/modules/Pro/library';
import { caseOf } from './mergeFixtures';

const A = caseOf({ id: 'TC-01' });
const B = caseOf({ id: 'TC-02' });
const C = caseOf({ id: 'TC-03' });

describe('mergeCases', () => {
  it('joins two QAs who changed different cases', () => {
    const mine = [caseOf({ id: 'TC-01', title: 'Mine' }), B];
    const theirs = [A, caseOf({ id: 'TC-02', title: 'Theirs' })];

    expect(mergeCases({ base: [A, B], mine, theirs }).map(({ title }) => title)).toEqual([
      'Mine',
      'Theirs',
    ]);
  });

  it('keeps a case each side added, this computer’s first', () => {
    expect(
      mergeCases({ base: [A], mine: [A, B], theirs: [A, C] }).map(({ id }) => id),
    ).toEqual(['TC-01', 'TC-02', 'TC-03']);
  });

  it('drops a case one side deleted and the other left alone', () => {
    expect(
      mergeCases({ base: [A, B], mine: [A], theirs: [A, B] }).map(({ id }) => id),
    ).toEqual(['TC-01']);
    expect(
      mergeCases({ base: [A, B], mine: [A, B], theirs: [B] }).map(({ id }) => id),
    ).toEqual(['TC-02']);
  });

  it('keeps this computer’s case when both changed it, the org keeping its own among its versions', () => {
    const mine = [caseOf({ id: 'TC-01', expected: 'Mine' })];
    const theirs = [caseOf({ id: 'TC-01', expected: 'Theirs' })];

    expect(mergeCases({ base: [A], mine, theirs })).toEqual(mine);
  });

  it('keeps both cases two QAs added under the same id, giving this computer’s the next free one', () => {
    const mine = caseOf({ id: 'TC-02', title: 'Mine' });
    const theirs = caseOf({ id: 'TC-02', title: 'Theirs' });

    expect(
      mergeCases({ base: [A], mine: [A, mine], theirs: [A, theirs] }).map(
        ({ id, title }) => [id, title],
      ),
    ).toEqual([
      ['TC-01', 'Case TC-01'],
      ['TC-02', 'Theirs'],
      ['TC-03', 'Mine'],
    ]);
  });

  it('keeps a case changed here that the org deleted', () => {
    const mine = [A, caseOf({ id: 'TC-02', title: 'Mine' })];

    expect(
      mergeCases({ base: [A, B], mine, theirs: [A] }).map(({ title }) => title),
    ).toEqual(['Case TC-01', 'Mine']);
  });

  it('reads a case the same whatever order its fields came in', () => {
    const reordered = {
      steps: A.steps.map(({ action, expected }) => ({ expected, action })),
      preconditions: A.preconditions,
      goal: A.goal,
      priority: A.priority,
      title: 'Theirs',
      id: A.id,
    };
    const mine = [
      {
        steps: A.steps.map(({ action, expected }) => ({ expected, action })),
        preconditions: A.preconditions,
        goal: A.goal,
        priority: A.priority,
        title: A.title,
        id: A.id,
      },
    ];

    expect(mergeCases({ base: [A], mine, theirs: [reordered] })[0]?.title).toBe('Theirs');
  });
});
