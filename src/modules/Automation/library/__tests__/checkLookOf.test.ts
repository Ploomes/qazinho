import { describe, expect, it } from 'vitest';
import { checkLookOf } from '@/modules/Automation/library';
import { suiteResult } from './fixtures';

describe('checkLookOf', () => {
  it('reads a test that passes in the copy as passed', () => {
    expect(checkLookOf([suiteResult({})])).toEqual({
      icon: 'passed',
      tone: 'pass',
      labelKey: 'AUTOMATION.CHANGE_CHECK_PASSED',
      count: 1,
      failed: 0,
    });
  });

  it('counts the tests of a new spec file, and those that fail', () => {
    expect(
      checkLookOf([suiteResult({}), suiteResult({ status: 'failed' }), suiteResult({})]),
    ).toEqual({
      icon: 'failed',
      tone: 'fail',
      labelKey: 'AUTOMATION.CHANGE_CHECKS_FAILED',
      count: 3,
      failed: 1,
    });
    expect(checkLookOf([suiteResult({}), suiteResult({})])).toMatchObject({
      labelKey: 'AUTOMATION.CHANGE_CHECKS_PASSED',
    });
  });

  it('reads a test that timed out, or passed only on a retry, by how it ended', () => {
    expect(checkLookOf([suiteResult({ status: 'timedOut' })])).toMatchObject({
      tone: 'fail',
    });
    expect(checkLookOf([suiteResult({ isFlaky: true })])).toMatchObject({ tone: 'pass' });
  });

  it('says so when QAzinho could not run any again', () => {
    expect(checkLookOf([])).toMatchObject({ icon: 'attention', tone: 'attn', count: 0 });
  });
});
