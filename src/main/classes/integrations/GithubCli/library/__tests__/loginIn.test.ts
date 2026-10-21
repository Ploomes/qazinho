import { describe, expect, it } from 'vitest';
import { loginIn } from '@/main/classes/integrations/GithubCli/library';

describe('loginIn', () => {
  it('names the account a user answer belongs to', () => {
    expect(loginIn('{"login":"octoqa","id":1}')).toBe('octoqa');
  });

  it('does NOT name an account in a body that is not a user', () => {
    expect(loginIn('{"message":"Bad credentials"}')).toBeNull();
    expect(loginIn('{"login":""}')).toBeNull();
    expect(loginIn('not json')).toBeNull();
  });
});
