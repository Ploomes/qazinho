import type { IStoredVariable } from '@/main/classes/storage/VariableVault/types';
import type { VariableChange } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { variablesAfter } from '@/main/classes/storage/VariableVault/library';

const EMAIL: IStoredVariable = {
  projectId: 'p-1',
  name: 'LOGIN_EMAIL',
  description: 'The admin on staging',
  value: 'qa@shop.test',
};
const OTHER: IStoredVariable = {
  projectId: 'p-2',
  name: 'LOGIN_EMAIL',
  description: 'Another project',
  value: 'other@shop.test',
};

function save(
  change: Partial<Extract<VariableChange, { kind: 'save' }>>,
): VariableChange {
  return {
    kind: 'save',
    name: 'LOGIN_PASSWORD',
    description: 'The admin password',
    value: 's3cret!',
    from: null,
    ...change,
  };
}

function after(changes: VariableChange[]) {
  return variablesAfter({ stored: [OTHER, EMAIL], apply: { projectId: 'p-1', changes } });
}

describe('variablesAfter', () => {
  it('adds a new variable to its project, with its description trimmed', () => {
    expect(after([save({ description: '  The admin password ' })])).toEqual({
      stored: [
        OTHER,
        EMAIL,
        {
          projectId: 'p-1',
          name: 'LOGIN_PASSWORD',
          description: 'The admin password',
          value: 's3cret!',
          isSecret: true,
        },
      ],
    });
  });

  it('keeps a variable the QA said is no secret as one', () => {
    expect(
      after([save({ name: 'ADMIN_EMAIL', value: 'qa@shop.test', isSecret: false })]),
    ).toMatchObject({ stored: [OTHER, EMAIL, { name: 'ADMIN_EMAIL', isSecret: false }] });
  });

  it('keeps the value it had when a change leaves the value out', () => {
    expect(
      after([save({ name: 'LOGIN_EMAIL', description: 'The owner', value: null })]),
    ).toEqual({
      stored: [OTHER, { ...EMAIL, description: 'The owner', isSecret: true }],
    });
  });

  it('renames a variable and keeps its value and its place', () => {
    expect(
      after([save({ name: 'ADMIN_EMAIL', from: 'LOGIN_EMAIL', value: null })]),
    ).toEqual({
      stored: [
        OTHER,
        {
          ...EMAIL,
          name: 'ADMIN_EMAIL',
          description: 'The admin password',
          isSecret: true,
        },
      ],
    });
  });

  it('keeps whether it is a secret when a change leaves that out', () => {
    const plain = after([save({ name: 'LOGIN_EMAIL', value: null, isSecret: false })]);

    expect(
      variablesAfter({
        stored: 'stored' in plain ? plain.stored : [],
        apply: {
          projectId: 'p-1',
          changes: [save({ name: 'ADMIN_EMAIL', from: 'LOGIN_EMAIL', value: null })],
        },
      }),
    ).toMatchObject({ stored: [OTHER, { name: 'ADMIN_EMAIL', isSecret: false }] });
  });

  it('removes a variable of this project only', () => {
    expect(after([{ kind: 'remove', name: 'LOGIN_EMAIL' }])).toEqual({ stored: [OTHER] });
  });

  it('does NOT take a name outside the rule, and keeps nothing of the changes', () => {
    for (const name of ['login_email', 'LOGIN EMAIL', '1EMAIL', '', `A${'B'.repeat(64)}`])
      expect(after([save({ name: 'FIRST' }), save({ name })])).toEqual({
        failure: { reason: 'bad-name', name },
      });
  });

  it('does NOT rename onto a name the project already keeps', () => {
    expect(
      after([
        save({ name: 'LOGIN_PASSWORD' }),
        save({ name: 'LOGIN_EMAIL', from: 'LOGIN_PASSWORD', value: null }),
      ]),
    ).toEqual({ failure: { reason: 'taken', name: 'LOGIN_EMAIL' } });
  });

  it('does NOT keep a new variable with no value', () => {
    for (const value of [null, ''])
      expect(after([save({ value })])).toEqual({
        failure: { reason: 'no-value', name: 'LOGIN_PASSWORD' },
      });
  });

  it('does NOT rename a variable the project does not keep', () => {
    expect(after([save({ from: 'GONE', value: null })])).toEqual({
      failure: { reason: 'missing', name: 'GONE' },
    });
  });

  it('keeps a value as it was typed, spaces and all', () => {
    expect(after([save({ value: '  pass word ' })])).toMatchObject({
      stored: [OTHER, EMAIL, { value: '  pass word ' }],
    });
  });
});
