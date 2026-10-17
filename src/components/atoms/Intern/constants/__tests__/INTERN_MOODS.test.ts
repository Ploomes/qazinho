import { describe, expect, it } from 'vitest';
import { INTERN_MOODS } from '@/components/atoms/Intern/constants';

describe('INTERN_MOODS', () => {
  it('has a strip for each theme, its frames and a word for every mood', () => {
    for (const mood of Object.values(INTERN_MOODS)) {
      expect(mood.light).toMatch(/\.png$/);
      expect(mood.dark).toMatch(/-escuro\.png$/);
      expect(mood.frames).toBeGreaterThan(1);
      expect(mood.frameMs).toBeGreaterThan(0);
      expect(mood.labelKey).toMatch(/^MASCOT\.MOOD_/);
    }
  });

  it('never shows one mood with the art of another', () => {
    expect(INTERN_MOODS.bug.light).toContain('estagiario-bug');
    expect(INTERN_MOODS.sleeping.dark).toContain('estagiario-dormindo');
    expect(INTERN_MOODS.flaky.light).toContain('estagiario-desconfiado');
  });
});
