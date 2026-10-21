import { describe, expect, it } from 'vitest';
import { variableNameOf } from '@/modules/Project/library';

describe('variableNameOf', () => {
  it('writes a name in capitals, with _ where a space or a mark was', () => {
    expect(variableNameOf('login email')).toBe('LOGIN_EMAIL');
    expect(variableNameOf('admin-password.v2')).toBe('ADMIN_PASSWORD_V2');
  });

  it('drops the accents a Portuguese name brings', () => {
    expect(variableNameOf('senha do usuário')).toBe('SENHA_DO_USUARIO');
  });

  it('keeps a name that already follows the rule', () => {
    expect(variableNameOf('LOGIN_PASSWORD_2')).toBe('LOGIN_PASSWORD_2');
  });

  it('stops at the longest name a variable may have', () => {
    expect(variableNameOf('a'.repeat(80))).toHaveLength(64);
  });
});
