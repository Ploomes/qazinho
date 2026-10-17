import { describe, expect, it } from 'vitest';
import { resolveLanguage } from '@/languages/library';

describe('resolveLanguage', () => {
  it('reads every flavour of Portuguese as Portuguese', () => {
    expect(resolveLanguage('pt-BR')).toBe('pt');
    expect(resolveLanguage('pt')).toBe('pt');
    expect(resolveLanguage('PT-pt')).toBe('pt');
  });

  it('falls back to English for a language QAzinho does not speak yet', () => {
    expect(resolveLanguage('es-419')).toBe('en');
    expect(resolveLanguage('ja')).toBe('en');
  });

  it('falls back to English when the machine says nothing', () => {
    expect(resolveLanguage(undefined)).toBe('en');
  });
});
