import { describe, expect, it } from 'vitest';
import { agentFailure } from '@/main/library';

describe('agentFailure', () => {
  it('stops with what the agent said went wrong', () => {
    expect(
      agentFailure({
        isError: true,
        text: 'API Error: 400 model: String should have at least 1 character',
      }),
    ).toEqual({
      reason: 'agent-error',
      said: 'API Error: 400 model: String should have at least 1 character',
    });
  });

  it('does NOT stop a turn the agent answered', () => {
    expect(agentFailure({ isError: false, text: '{"actions":[]}' })).toBeNull();
  });

  it('still says why when the agent errored in silence', () => {
    expect(agentFailure({ isError: true, text: '' })).toEqual({ reason: 'agent-silent' });
  });

  /** Um agente deslogado respondia ao QA com "Run codex login in a terminal". */
  it.each([
    'Invalid API key · Please run /login',
    'unexpected status 401 Unauthorized: Missing bearer or basic authentication in header',
    'Not logged in · Please run /login',
    'OAuth token has expired. Please obtain a new token or refresh your existing token.',
  ])('knows a signed-out agent when it says "%s"', (text) => {
    expect(agentFailure({ isError: true, text })).toEqual({ reason: 'agent-signed-out' });
  });

  it('does NOT take a page that answered 401 for a signed-out agent unless the agent itself failed on it', () => {
    expect(
      agentFailure({ isError: false, text: 'The page said 401 Unauthorized' }),
    ).toBeNull();
  });
});
