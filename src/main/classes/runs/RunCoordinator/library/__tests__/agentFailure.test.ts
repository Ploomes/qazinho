import { describe, expect, it } from 'vitest';
import { agentFailure } from '@/main/classes/runs/RunCoordinator/library';

describe('agentFailure', () => {
  it('stops the run with what the agent said went wrong', () => {
    expect(
      agentFailure({
        isError: true,
        text: 'API Error: 400 model: String should have at least 1 character',
      }),
    ).toBe(
      'The agent answered with an error, so the run stopped: API Error: 400 model: String should have at least 1 character',
    );
  });

  it('does NOT stop a run the agent answered', () => {
    expect(agentFailure({ isError: false, text: '{"actions":[]}' })).toBeNull();
  });

  it('still says why when the agent errored in silence', () => {
    expect(agentFailure({ isError: true, text: '' })).toBe(
      'The agent stopped answering, so the run stopped too.',
    );
  });
});
