import { describe, expect, it } from 'vitest';
import { jiraFailureOf } from '@/main/classes/integrations/JiraApi/library';

describe('jiraFailureOf', () => {
  it('reads a refused token, a missing issue and an answer it did not expect', () => {
    expect(jiraFailureOf({ status: 401 })).toBe('unauthorized');
    expect(jiraFailureOf({ status: 403 })).toBe('unauthorized');
    expect(jiraFailureOf({ status: 404 })).toBe('not-found');
    expect(jiraFailureOf({ status: 500 })).toBe('unexpected');
  });

  it('reads what Jira refused to take: a field it requires, or a file too large', () => {
    expect(jiraFailureOf({ status: 400 })).toBe('rejected');
    expect(jiraFailureOf({ status: 413 })).toBe('rejected');
  });

  it('calls no answer at all out of reach', () => {
    expect(jiraFailureOf(null)).toBe('unreachable');
  });
});
