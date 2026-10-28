import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { connectFailureOf } from '@/modules/Setup/library';

const said = (props: Parameters<typeof connectFailureOf>[0]) => {
  const { key, values } = connectFailureOf(props);

  return i18n.t(key, values);
};

describe('connectFailureOf', () => {
  /**
   * A main escrevia isto em inglês, e um QA lendo o QAzinho em português os recebia
   * assim.
   */
  it('says why Jira refused, in the language the QA reads', async () => {
    await i18n.changeLanguage('pt');

    expect(said({ failure: { reason: 'unauthorized' }, tracker: 'Jira' })).toBe(
      'O Jira não aceitou essas credenciais. Confira o e-mail e o token, e tente de novo.',
    );

    await i18n.changeLanguage('en');

    expect(
      said({ failure: { reason: 'unexpected', status: 502 }, tracker: 'Jira' }),
    ).toBe('Jira answered in a way QAzinho did not expect (HTTP 502).');
  });

  it('names what the GitHub CLI lacks', async () => {
    await i18n.changeLanguage('en');

    expect(
      said({
        failure: { reason: 'scopes', scopes: ['repo', 'read:org'] },
        tracker: 'GitHub',
      }),
    ).toBe('The GitHub CLI is signed in without access to repo, read:org.');
    expect(
      said({ failure: { reason: 'github', failure: 'no-cli' }, tracker: 'GitHub' }),
    ).toContain('The GitHub CLI is not on this machine');
  });
});
