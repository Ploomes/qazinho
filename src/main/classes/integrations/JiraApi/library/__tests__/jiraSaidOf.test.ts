import { describe, expect, it } from 'vitest';
import { jiraSaidOf } from '@/main/classes/integrations/JiraApi/library';

describe('jiraSaidOf', () => {
  it('reads Jira’s messages, then what was wrong with each field', () => {
    expect(
      jiraSaidOf({
        errorMessages: ['You cannot create issues here.'],
        errors: { components: 'Component/s is required.', priority: ' ' },
      }),
    ).toBe('You cannot create issues here. Component/s is required.');
  });

  it('says nothing for a body that is not Jira’s refusal', () => {
    expect(jiraSaidOf(null)).toBe('');
    expect(jiraSaidOf('<html>')).toBe('');
    expect(jiraSaidOf({ errorMessages: [42], errors: null })).toBe('');
  });

  it('reads Confluence too: its message, and the title and detail of each error it lists', () => {
    expect(jiraSaidOf({ message: 'No Confluence' })).toBe('No Confluence');
    expect(
      jiraSaidOf({
        errors: [
          { title: 'A page with this title already exists', detail: 'Pick another' },
        ],
      }),
    ).toBe('A page with this title already exists Pick another');
  });
});
