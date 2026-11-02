import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';

/** Estagiário é uma palavra, não um nome próprio: em inglês o mascote é the Intern. */
describe('the mascot in English', () => {
  it('is the Intern on every screen', () => {
    expect(JSON.stringify(en)).not.toMatch(/estagi/i);
  });
});
