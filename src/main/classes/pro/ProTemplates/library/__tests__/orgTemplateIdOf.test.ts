import { describe, expect, it } from 'vitest';
import {
  orgTemplateIdOf,
  remoteTemplateIdOf,
} from '@/main/classes/pro/ProTemplates/library';

describe('orgTemplateIdOf', () => {
  it('names the org, so two orgs never share an id with each other or a local one', () => {
    expect(orgTemplateIdOf({ orgSlug: 'loja', id: 'a1' })).toBe('org:loja:a1');
    expect(orgTemplateIdOf({ orgSlug: 'outra', id: 'a1' })).not.toBe('org:loja:a1');
  });

  it('comes back to the id the org gave', () => {
    expect(
      remoteTemplateIdOf(orgTemplateIdOf({ orgSlug: 'loja-online', id: 'a1' })),
    ).toBe('a1');
  });
});
