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

    expect(
      mergeCases({ base: [A, B], mine, theirs }).cases.map(({ title }) => title),
    ).toEqual(['Mine', 'Theirs']);
  });

  it('keeps a case each side added, this computer’s first', () => {
    expect(
      mergeCases({ base: [A], mine: [A, B], theirs: [A, C] }).cases.map(({ id }) => id),
    ).toEqual(['TC-01', 'TC-02', 'TC-03']);
  });

  it('drops a case one side deleted and the other left alone', () => {
    expect(
      mergeCases({ base: [A, B], mine: [A], theirs: [A, B] }).cases.map(({ id }) => id),
    ).toEqual(['TC-01']);
    expect(
      mergeCases({ base: [A, B], mine: [A, B], theirs: [B] }).cases.map(({ id }) => id),
    ).toEqual(['TC-02']);
  });

  it('calls a case both changed a clash, and keeps this computer’s until the QA chooses', () => {
    const mine = [caseOf({ id: 'TC-01', expected: 'Mine' })];
    const theirs = [caseOf({ id: 'TC-01', expected: 'Theirs' })];

    expect(mergeCases({ base: [A], mine, theirs })).toEqual({
      cases: mine,
      clashes: [{ id: 'TC-01', mine: mine[0], theirs: theirs[0] }],
    });
  });

  it('keeps the side the QA chose of a case both changed', () => {
    const mine = [caseOf({ id: 'TC-01', expected: 'Mine' }), B];
    const theirs = [caseOf({ id: 'TC-01', expected: 'Theirs' }), B];

    expect(
      mergeCases({ base: [A, B], mine, theirs, choices: { 'TC-01': 'theirs' } }).cases,
    ).toEqual(theirs);
    expect(
      mergeCases({ base: [A, B], mine, theirs, choices: { 'TC-01': 'mine' } }).cases,
    ).toEqual(mine);
  });

  it('does NOT call a clash a case both changed the same way', () => {
    const same = [caseOf({ id: 'TC-01', title: 'Same' })];

    expect(mergeCases({ base: [A], mine: same, theirs: same })).toEqual({
      cases: same,
      clashes: [],
    });
  });

  it('keeps both cases two QAs added under the same id, giving this computer’s the next free one', () => {
    const mine = caseOf({ id: 'TC-02', title: 'Mine' });
    const theirs = caseOf({ id: 'TC-02', title: 'Theirs' });

    expect(
      mergeCases({ base: [A], mine: [A, mine], theirs: [A, theirs] }).cases.map(
        ({ id, title }) => [id, title],
      ),
    ).toEqual([
      ['TC-01', 'Case TC-01'],
      ['TC-02', 'Theirs'],
      ['TC-03', 'Mine'],
    ]);
  });

  it('calls a case changed here that the org deleted a clash, gone only if the QA takes the org’s', () => {
    const mine = [A, caseOf({ id: 'TC-02', title: 'Mine' })];
    const merged = mergeCases({ base: [A, B], mine, theirs: [A] });

    expect(merged.cases.map(({ title }) => title)).toEqual(['Case TC-01', 'Mine']);
    expect(merged.clashes).toEqual([{ id: 'TC-02', mine: mine[1], theirs: null }]);
    expect(
      mergeCases({ base: [A, B], mine, theirs: [A], choices: { 'TC-02': 'theirs' } })
        .cases,
    ).toEqual([A]);
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

    expect(mergeCases({ base: [A], mine, theirs: [reordered] }).cases[0]?.title).toBe(
      'Theirs',
    );
  });
});
