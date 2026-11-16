import { describe, expect, it } from 'vitest';
import { sentenceOf } from '@/app/components/Sidebar/library';

describe('sentenceOf', () => {
  it('starts a line in a capital, as a sentence', () => {
    expect(sentenceOf({ text: 'falhou, 2 bugs', language: 'pt' })).toBe('Falhou, 2 bugs');
    expect(sentenceOf({ text: 'é novo', language: 'pt' })).toBe('É novo');
  });

  it('keeps an empty text empty', () => {
    expect(sentenceOf({ text: '', language: 'en' })).toBe('');
  });
});
