import { describe, expect, it } from 'vitest';
import { secretIn } from '@/modules/Project/library';

describe('secretIn', () => {
  it('holds back a token first', () => {
    expect(secretIn('senha Teste-1234 e o token ghp_a1b2c3d4e5f6g7h8i9j0k1l2')).toBe(
      'ghp_a1b2c3d4e5f6g7h8i9j0k1l2',
    );
  });

  /** A QA planning a login told the chat the account's password in words. */
  it('holds back a password written out after the word', () => {
    expect(secretIn('a conta é qa@loja.test e a senha é Teste-1234')).toBe('Teste-1234');
  });

  it('does NOT hold back talk about a password', () => {
    expect(secretIn('teste a senha errada e o esqueci a senha')).toBeNull();
    expect(secretIn('use ${LOGIN_PASSWORD} como senha')).toBeNull();
  });
});
