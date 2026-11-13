import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { NAMED_KEYS } from '@/modules/Chat/screens/Chat/components/NamedNote/constants';

beforeEach(async () => {
  await i18n.changeLanguage('pt');
});

describe('NAMED_KEYS', () => {
  it('says the name in every sentence, each with where it came from', () => {
    const said = Object.values(NAMED_KEYS).map((key) => i18n.t(key, { name: 'Loja' }));

    expect(said.every((text) => text.includes('Loja'))).toBe(true);
    expect(new Set(said).size).toBe(Object.keys(NAMED_KEYS).length);
  });
});
