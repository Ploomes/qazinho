import { describe, expect, it } from 'vitest';
import { passwordsIn } from '@/modules/Project/library';

describe('passwordsIn', () => {
  it('finds each password written after the word, in Portuguese or English', () => {
    expect(
      passwordsIn(
        'senha Teste-1234, then password: hunter2! and the password "S3nh@forte".',
      ),
    ).toEqual(['Teste-1234', 'hunter2!', 'S3nh@forte']);
  });

  it('does NOT take a plain word or a variable for a password', () => {
    expect(passwordsIn('Digitar a senha errada')).toEqual([]);
    expect(passwordsIn('Type ${LOGIN_PASSWORD} in the password field')).toEqual([]);
    expect(passwordsIn('Esqueci a senha abre a recuperação')).toEqual([]);
  });
});
