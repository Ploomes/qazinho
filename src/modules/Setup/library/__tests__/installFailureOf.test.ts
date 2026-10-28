import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { installFailureOf } from '@/modules/Setup/library';

const said = (failure: Parameters<typeof installFailureOf>[0]) => {
  const told = installFailureOf(failure);

  return 'text' in told ? told.text : i18n.t(told.key, told.values);
};

describe('installFailureOf', () => {
  /** Um QA no Windows sem Node.js, lendo o QAzinho em português, lia isto em inglês. */
  it('says what is missing in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    expect(said({ reason: 'missing', tool: 'npm' })).toContain('nodejs.org');
    expect(said({ reason: 'missing', tool: 'npm' })).toContain('esta máquina');
    expect(said({ reason: 'missing', tool: 'mkdir' })).toBe(
      'O mkdir não está nesta máquina.',
    );

    await i18n.changeLanguage('en');

    expect(said({ reason: 'stopped', tool: 'npm', code: 1 })).toBe(
      'npm stopped with code 1.',
    );
  });

  it('keeps what the tool printed as it printed it', () => {
    expect(said({ reason: 'said', text: 'npm ERR! code EACCES' })).toBe(
      'npm ERR! code EACCES',
    );
  });
});
