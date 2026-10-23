import { describe, expect, it } from 'vitest';
import { freeVariableName } from '@/modules/Plan/library';

describe('freeVariableName', () => {
  it('takes the base when it is free', () => {
    expect(freeVariableName({ base: 'PASSWORD', taken: ['LOGIN_EMAIL'] })).toBe(
      'PASSWORD',
    );
  });

  it('numbers it past the names the project already keeps', () => {
    expect(
      freeVariableName({ base: 'PASSWORD', taken: ['PASSWORD', 'PASSWORD_2'] }),
    ).toBe('PASSWORD_3');
  });
});
