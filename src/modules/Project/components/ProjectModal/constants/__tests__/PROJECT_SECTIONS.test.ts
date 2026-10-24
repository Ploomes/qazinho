// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { PROJECT_SECTIONS } from '@/modules/Project/components/ProjectModal/constants';

describe('PROJECT_SECTIONS', () => {
  it('opens on what the project is, before its code, its variables and its suite', () => {
    expect(PROJECT_SECTIONS.map(({ id }) => id)).toEqual([
      'general',
      'code',
      'variables',
      'automation',
    ]);
  });

  it('leaves deleting out of the sections, so it never sits among them', () => {
    expect(PROJECT_SECTIONS.map(({ id }) => id)).not.toContain('delete');
  });

  it.each(['en', 'pt'] as const)('names every section in %s', (language) => {
    const t = i18n.getFixedT(language);

    expect(PROJECT_SECTIONS.map(({ labelKey }) => t(labelKey))).toEqual(
      language === 'en'
        ? ['General', 'Code', 'Variables', 'Automation']
        : ['Geral', 'Código', 'Variáveis', 'Automação'],
    );
  });
});
