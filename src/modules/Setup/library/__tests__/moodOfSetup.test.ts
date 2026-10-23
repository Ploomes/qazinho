import { describe, expect, it } from 'vitest';
import { moodOfSetup } from '@/modules/Setup/library';

const CALM = { installs: [], isChecking: false, hasAgent: true };

describe('moodOfSetup', () => {
  it('greets calmly, and celebrates at the end', () => {
    expect(moodOfSetup({ ...CALM, step: 'welcome' })).toBe('neutral');
    expect(moodOfSetup({ ...CALM, step: 'done' })).toBe('passed');
  });

  it('gets busy while something installs, and falls apart when it fails', () => {
    expect(
      moodOfSetup({
        ...CALM,
        step: 'devices',
        installs: [{ phase: 'installing', stage: 1, stages: 4, line: '' }],
      }),
    ).toBe('running');
    expect(
      moodOfSetup({
        ...CALM,
        step: 'agents',
        installs: [
          {
            phase: 'failed',
            failure: { reason: 'said' as const, text: 'EACCES' },
            command: 'npm i -g x',
            isFix: false,
          },
        ],
      }),
    ).toBe('broken');
  });

  it('thinks while the machine is looked at again', () => {
    expect(moodOfSetup({ ...CALM, step: 'agents', isChecking: true })).toBe('thinking');
  });

  it('turns suspicious when there is no agent to test with', () => {
    expect(moodOfSetup({ ...CALM, step: 'agents', hasAgent: false })).toBe('flaky');
  });

  it('does NOT carry an install from another step onto the trackers', () => {
    expect(
      moodOfSetup({
        ...CALM,
        step: 'integrations',
        installs: [{ phase: 'installing', stage: 1, stages: 1, line: '' }],
      }),
    ).toBe('neutral');
  });
});
