import { describe, expect, it } from 'vitest';
import { INTERN_MOODS } from '@/components/atoms/Intern/constants';

describe('INTERN_MOODS', () => {
  it('has a loop length and a word for every mood', () => {
    for (const mood of Object.values(INTERN_MOODS)) {
      expect(mood.loopMs).toBeGreaterThan(0);
      expect(mood.labelKey).toMatch(/^MASCOT\.MOOD_/);
    }
  });

  it('keeps the pace the designer gave him: a slow sleep and a quick celebration', () => {
    expect(INTERN_MOODS.sleeping.loopMs).toBe(2880);
    expect(INTERN_MOODS.passed.loopMs).toBe(1200);
  });
});
