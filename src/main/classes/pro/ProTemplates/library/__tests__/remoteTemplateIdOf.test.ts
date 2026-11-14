import { describe, expect, it } from 'vitest';
import { remoteTemplateIdOf } from '@/main/classes/pro/ProTemplates/library';

describe('remoteTemplateIdOf', () => {
  it('reads the id the org gave out of one kept here as the org’s', () => {
    expect(remoteTemplateIdOf('org:loja:3f1c')).toBe('3f1c');
  });

  it('says a local template has no id in an org', () => {
    expect(remoteTemplateIdOf('tpl-3f1c')).toBeNull();
    expect(remoteTemplateIdOf('org:loja:')).toBeNull();
    expect(remoteTemplateIdOf('')).toBeNull();
  });
});
