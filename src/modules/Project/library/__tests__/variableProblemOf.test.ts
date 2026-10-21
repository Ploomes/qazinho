import type { IVariableDraft } from '@/modules/Project/types';
import { describe, expect, it } from 'vitest';
import { variableProblemOf } from '@/modules/Project/library';

const draft = (change: Partial<IVariableDraft>): IVariableDraft => ({
  key: 'k',
  name: 'LOGIN_EMAIL',
  description: '',
  value: 'qa@shop.test',
  from: null,
  ...change,
});

describe('variableProblemOf', () => {
  it('finds nothing in variables ready to save', () => {
    expect(
      variableProblemOf([
        draft({}),
        draft({ name: 'LOGIN_PASSWORD', value: '', from: 'LOGIN_PASSWORD' }),
      ]),
    ).toBeNull();
  });

  it('asks for a name before anything else', () => {
    expect(variableProblemOf([draft({ name: '', value: '' })])).toEqual({
      key: 'VARIABLES.NEEDS_NAME',
      name: '',
    });
  });

  it('does NOT take a name that starts with a digit or an underscore', () => {
    for (const name of ['2FA_CODE', '_TOKEN'])
      expect(variableProblemOf([draft({ name })])).toEqual({
        key: 'VARIABLES.BAD_NAME',
        name,
      });
  });

  it('does NOT take one name twice', () => {
    expect(variableProblemOf([draft({}), draft({ key: 'other' })])).toEqual({
      key: 'VARIABLES.TWICE',
      name: 'LOGIN_EMAIL',
    });
  });

  it('asks a new variable for its value, while a saved one keeps its own', () => {
    expect(variableProblemOf([draft({ value: '' })])).toEqual({
      key: 'VARIABLES.NEEDS_VALUE',
      name: 'LOGIN_EMAIL',
    });
    expect(variableProblemOf([draft({ value: '', from: 'LOGIN_EMAIL' })])).toBeNull();
  });
});
