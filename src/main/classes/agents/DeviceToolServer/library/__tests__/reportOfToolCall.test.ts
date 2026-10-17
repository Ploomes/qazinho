import { describe, expect, it } from 'vitest';
import { reportOfToolCall } from '@/main/classes/agents/DeviceToolServer/library';

describe('reportOfToolCall', () => {
  it('files what the agent judged, trimmed', () => {
    expect(
      reportOfToolCall({
        step: 2,
        verdict: 'failed',
        why: ' The total is wrong ',
        got: 'R$ 0,00',
        title: 'Cart total ignores the coupon',
        severity: 'high',
        note: 'Closed the cookie banner first.',
      }),
    ).toEqual({
      report: {
        step: 2,
        verdict: 'failed',
        why: 'The total is wrong',
        got: 'R$ 0,00',
        title: 'Cart total ignores the coupon',
        severity: 'high',
        note: 'Closed the cookie banner first.',
      },
    });
  });

  it('fills what is optional, and calls an unknown severity medium', () => {
    expect(
      reportOfToolCall({
        step: '1',
        verdict: 'passed',
        why: 'It shows',
        got: 'Home',
        severity: 'huge',
      }),
    ).toMatchObject({ report: { step: 1, title: '', note: '', severity: 'medium' } });
  });

  it('does NOT file a verdict it does not know, and says which ones exist', () => {
    expect(reportOfToolCall({ step: 1, verdict: 'ok', why: 'x', got: '' })).toEqual({
      error: '"report" needs "verdict": passed, failed or blocked.',
    });
  });

  it('does NOT file a report without a step number or a reason', () => {
    expect(reportOfToolCall({ verdict: 'passed', why: 'x' })).toHaveProperty('error');
    expect(reportOfToolCall({ step: 0, verdict: 'passed', why: 'x' })).toHaveProperty(
      'error',
    );
    expect(reportOfToolCall({ step: 1, verdict: 'passed', why: '  ' })).toHaveProperty(
      'error',
    );
    expect(reportOfToolCall(undefined)).toHaveProperty('error');
  });
});
