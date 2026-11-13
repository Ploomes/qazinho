import { describe, expect, it } from 'vitest';
import { orgTemplateOf } from '@/main/classes/pro/ProTemplates/library';

describe('orgTemplateOf', () => {
  it('keeps the template with the org in its id, the default and the author’s name', () => {
    expect(
      orgTemplateOf({
        orgSlug: 'loja',
        template: {
          id: 'a1',
          kind: 'plan',
          name: 'Plano do time',
          title: '',
          parts: [{ kind: 'section', field: 'cases', heading: 'Casos' }],
          cases: 'gherkin',
          isDefault: true,
          author: { id: 'u1', name: 'Ana' },
          updatedAt: '2026-11-13T15:00:00.000Z',
        },
      }),
    ).toEqual({
      id: 'org:loja:a1',
      kind: 'plan',
      name: 'Plano do time',
      title: '',
      parts: [{ kind: 'section', field: 'cases', heading: 'Casos' }],
      cases: 'gherkin',
      updatedAt: '2026-11-13T15:00:00.000Z',
      orgSlug: 'loja',
      isDefault: true,
      author: 'Ana',
    });
  });
});
