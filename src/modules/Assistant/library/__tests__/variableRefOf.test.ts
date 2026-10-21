import { describe, expect, it } from 'vitest';
import { variableRefOf } from '@/modules/Assistant/library';

describe('variableRefOf', () => {
  it('reads a variable named the way a step writes it', () => {
    expect(variableRefOf(' ${LOGIN_EMAIL} ')).toBe('LOGIN_EMAIL');
  });

  it('reads a variable named in plain words', () => {
    expect(variableRefOf('login email')).toBe('LOGIN_EMAIL');
  });

  it('leaves a name that already follows the rule as it is', () => {
    expect(variableRefOf('SELLER_PASSWORD')).toBe('SELLER_PASSWORD');
  });
});
