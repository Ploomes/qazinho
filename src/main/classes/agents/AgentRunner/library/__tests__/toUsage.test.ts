import { describe, expect, it } from 'vitest';
import { toUsage } from '@/main/classes/agents/AgentRunner/library';

const LIMITS = {
  type: 'rate_limit_event',
  rate_limit_info: {
    unifiedWindows: {
      five_hour: { utilization: 0.36, resetsAt: 1789542600 },
      seven_day: { utilization: 0.33 },
    },
  },
};

const RESULT = {
  type: 'result',
  usage: { input_tokens: 2, cache_read_input_tokens: 10126 },
  modelUsage: { 'claude-opus-5': { contextWindow: 1000000 } },
};

/** O Claude Code antes da 2.1.273 relatava o limite sem utilização nele. */
const OLD_LIMITS = {
  type: 'rate_limit_event',
  rate_limit_info: {
    status: 'allowed',
    resetsAt: 1789575000,
    rateLimitType: 'five_hour',
  },
};

describe('toUsage', () => {
  it('an agent too old to report utilization leaves the window unknown', () => {
    const usage = toUsage({ previous: null, line: OLD_LIMITS });

    expect(usage.fiveHourUsed).toBeNull();
    expect(usage.sevenDayUsed).toBeNull();
  });

  it('a window the agent never mentioned is unknown, not empty', () => {
    const usage = toUsage({ previous: null, line: RESULT });

    expect(usage.fiveHourUsed).toBeNull();
    expect(usage.sevenDayUsed).toBeNull();
    expect(usage.contextWindow).toBe(1000000);
  });

  it('reads how much of the account the QA has spent', () => {
    const usage = toUsage({ previous: null, line: LIMITS });

    expect(usage.fiveHourUsed).toBe(0.36);
    expect(usage.sevenDayUsed).toBe(0.33);
    expect(usage.resetsAt).toBe(1789542600);
  });

  it('reads the context the turn carried, cache included', () => {
    const usage = toUsage({ previous: null, line: RESULT });

    expect(usage.contextTokens).toBe(10128);
    expect(usage.contextWindow).toBe(1000000);
  });

  it('keeps the limits it already knew when the result arrives', () => {
    const limits = toUsage({ previous: null, line: LIMITS });

    const usage = toUsage({ previous: limits, line: RESULT });

    expect(usage.fiveHourUsed).toBe(0.36);
    expect(usage.contextTokens).toBe(10128);
  });

  it('leaves what it has alone for an event that carries nothing', () => {
    const limits = toUsage({ previous: null, line: LIMITS });

    expect(toUsage({ previous: limits, line: { type: 'assistant' } })).toEqual(limits);
  });
});
