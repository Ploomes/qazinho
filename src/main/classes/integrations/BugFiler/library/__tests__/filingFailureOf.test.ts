import { describe, expect, it } from 'vitest';
import { filingFailureOf } from '@/main/classes/integrations/BugFiler/library';

describe('filingFailureOf', () => {
  it('reads gh gone or signed out as GitHub not reachable through it', () => {
    expect(filingFailureOf({ failure: 'no-cli', httpStatus: null })).toBe(
      'not-connected',
    );
    expect(filingFailureOf({ failure: 'signed-out', httpStatus: null })).toBe(
      'unauthorized',
    );
  });

  it('reads a repository refused or not there as GitHub said it', () => {
    expect(filingFailureOf({ failure: 'denied', httpStatus: 403 })).toBe('unauthorized');
    expect(filingFailureOf({ failure: 'not-found', httpStatus: 404 })).toBe('not-found');
    expect(filingFailureOf({ failure: 'unreachable', httpStatus: null })).toBe(
      'unreachable',
    );
  });

  /** A repository with its issues turned off answers 410, and a title GitHub will not take 422. */
  it('reads an issue GitHub would not take as refused', () => {
    expect(filingFailureOf({ failure: 'unexpected', httpStatus: 422 })).toBe('rejected');
    expect(filingFailureOf({ failure: 'unexpected', httpStatus: 410 })).toBe('rejected');
    expect(filingFailureOf({ failure: 'unexpected', httpStatus: 500 })).toBe(
      'unexpected',
    );
  });
});
