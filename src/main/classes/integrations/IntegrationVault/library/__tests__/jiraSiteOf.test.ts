import { describe, expect, it } from 'vitest';
import { jiraSiteOf } from '@/main/classes/integrations/IntegrationVault/library';

describe('jiraSiteOf', () => {
  it('reads a bare host as an https site', () => {
    expect(jiraSiteOf('acme.atlassian.net')).toBe('https://acme.atlassian.net');
  });

  it('keeps only the origin of a page pasted from inside Jira', () => {
    expect(
      jiraSiteOf('https://acme.atlassian.net/jira/software/projects/QA/boards/1'),
    ).toBe('https://acme.atlassian.net');
  });

  it('does NOT take plain http, which would send the token in the clear', () => {
    expect(jiraSiteOf('http://acme.atlassian.net')).toBeNull();
  });

  it('does NOT take a word that is not a host, or nothing at all', () => {
    expect(jiraSiteOf('acme')).toBeNull();
    expect(jiraSiteOf('   ')).toBeNull();
  });
});
