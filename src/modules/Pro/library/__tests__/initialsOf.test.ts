import { describe, expect, it } from 'vitest';
import { initialsOf } from '@/modules/Pro/library';

describe('initialsOf', () => {
  it('takes the first and the last name’s letters', () => {
    expect(initialsOf('Ana Clara Souza')).toBe('AS');
    expect(initialsOf('carla')).toBe('C');
  });

  it('reads an e-mail by what comes before the at', () => {
    expect(initialsOf('ana.souza@loja.dev')).toBe('AS');
  });

  it('gives nothing for nothing', () => {
    expect(initialsOf('')).toBe('');
  });
});
