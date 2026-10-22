import { describe, expect, it } from 'vitest';
import { jiraFailureOf } from '@/main/classes/integrations/JiraApi/library';

describe('jiraFailureOf', () => {
  it('reads a refused token, a missing issue and an answer it did not expect', () => {
    expect(jiraFailureOf({ status: 401 })).toBe('unauthorized');
    expect(jiraFailureOf({ status: 403 })).toBe('unauthorized');
    expect(jiraFailureOf({ status: 404 })).toBe('not-found');
    expect(jiraFailureOf({ status: 500 })).toBe('unexpected');
  });

  it('calls no answer at all out of reach', () => {
    expect(jiraFailureOf(null)).toBe('unreachable');
  });
});
