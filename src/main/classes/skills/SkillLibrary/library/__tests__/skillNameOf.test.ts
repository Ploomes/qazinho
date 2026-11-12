import { describe, expect, it } from 'vitest';
import { skillNameOf } from '@/main/classes/skills/SkillLibrary/library';

describe('skillNameOf', () => {
  it('turns any words into lowercase words joined by hyphens, without accents', () => {
    expect(skillNameOf('Casos em Gherkin!')).toBe('casos-em-gherkin');
    expect(skillNameOf('  Prioridade & Automação  ')).toBe('prioridade-automacao');
  });

  it('leaves nothing when nothing is a letter or a number', () => {
    expect(skillNameOf('—!!')).toBe('');
  });

  it('keeps a long name within 64 characters, never ending on a hyphen', () => {
    const name = skillNameOf(`${'a'.repeat(63)} b`);

    expect(name.length).toBeLessThanOrEqual(64);
    expect(name.endsWith('-')).toBe(false);
  });
});
