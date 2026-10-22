import { describe, expect, it } from 'vitest';
import { checkLookOf } from '@/modules/Automation/library';
import { suiteResult } from './fixtures';

describe('checkLookOf', () => {
  it('reads a test that passes in the copy as passed', () => {
    expect(checkLookOf(suiteResult({}))).toEqual({
      icon: 'passed',
      tone: 'pass',
      labelKey: 'AUTOMATION.CHANGE_CHECK_PASSED',
    });
  });

  it('reads a test that failed, timed out or passed only on a retry by how it ended', () => {
    expect(checkLookOf(suiteResult({ status: 'timedOut' }))).toMatchObject({
      tone: 'fail',
    });
    expect(checkLookOf(suiteResult({ status: 'passed', isFlaky: true }))).toMatchObject({
      tone: 'pass',
    });
  });

  it('says so when QAzinho could not run it again', () => {
    expect(checkLookOf(null)).toMatchObject({ icon: 'attention', tone: 'attn' });
  });
});
