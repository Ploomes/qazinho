import { describe, expect, it } from 'vitest';
import { isSecretName } from '@/modules/Project/library';

describe('isSecretName', () => {
  it('takes an email or a user name as no secret', () => {
    for (const name of [
      'CRM_EMAIL',
      'ADMIN_USER',
      'LOGIN',
      'STAGING_URL',
      'NOME_USUARIO',
    ])
      expect(isSecretName(name)).toBe(false);
  });

  it('takes a password, a token or a key as a secret', () => {
    for (const name of ['CRM_PASSWORD', 'API_TOKEN', 'STRIPE_KEY', 'SENHA', 'SMS_CODE'])
      expect(isSecretName(name)).toBe(true);
  });

  it('keeps a secret when a name says both, such as a user password', () => {
    expect(isSecretName('USER_PASSWORD')).toBe(true);
    expect(isSecretName('LOGIN_TOKEN')).toBe(true);
  });

  it('takes a name it does not know as a secret, to be safe', () => {
    expect(isSecretName('CPF')).toBe(true);
    expect(isSecretName('')).toBe(true);
  });

  it('does NOT read a part of a word: a MONKEY is no key', () => {
    expect(isSecretName('MONKEY_EMAIL')).toBe(false);
  });
});
