import { describe, expect, it } from 'vitest';
import { requestOutcomeOf } from '@/modules/Run/library';

describe('requestOutcomeOf', () => {
  it('reads an answer by the class of its status', () => {
    expect(requestOutcomeOf({ status: 200, failure: null })).toBe('ok');
    expect(requestOutcomeOf({ status: 204, failure: null })).toBe('ok');
    expect(requestOutcomeOf({ status: 304, failure: null })).toBe('redirect');
    expect(requestOutcomeOf({ status: 404, failure: null })).toBe('client');
    expect(requestOutcomeOf({ status: 503, failure: null })).toBe('server');
  });

  it('tells a failure on the way from one the app gave up on', () => {
    expect(
      requestOutcomeOf({ status: null, failure: 'net::ERR_CONNECTION_REFUSED' }),
    ).toBe('failed');
    expect(requestOutcomeOf({ status: null, failure: 'net::ERR_ABORTED' })).toBe(
      'canceled',
    );
  });

  it('believes a failure over a status heard before it', () => {
    expect(requestOutcomeOf({ status: 200, failure: 'net::ERR_FAILED' })).toBe('failed');
  });

  /** A no-cors call answered 204 came back from Chrome as aborted: the app got its answer, so the QA reads the status. */
  it('reads the answer the server gave when the browser only stopped reading it', () => {
    expect(requestOutcomeOf({ status: 204, failure: 'net::ERR_ABORTED' })).toBe('ok');
    expect(requestOutcomeOf({ status: 404, failure: 'net::ERR_ABORTED' })).toBe('client');
  });

  it('says nothing it did not hear: no status, or one no server sends', () => {
    expect(requestOutcomeOf({ status: null, failure: null })).toBe('unknown');
    expect(requestOutcomeOf({ status: 0, failure: null })).toBe('unknown');
  });
});
