import { describe, expect, it } from 'vitest';
import { SIDEBAR_NAME_MOTION } from '@/app/components/Sidebar/constants';

describe('SIDEBAR_NAME_MOTION', () => {
  /** O nome novo aparece da esquerda para a direita, como se fosse escrito. */
  it('writes the new name in from the left, whole at the end', () => {
    expect(SIDEBAR_NAME_MOTION.initial.clipPath).toBe('inset(0 100% 0 0)');
    expect(SIDEBAR_NAME_MOTION.animate.clipPath).toBe('inset(0 0% 0 0)');
    expect(SIDEBAR_NAME_MOTION.animate.opacity).toBe(1);
  });

  it('lets the old name go faster than the new one comes', () => {
    expect(SIDEBAR_NAME_MOTION.exit.transition.duration).toBeLessThan(
      SIDEBAR_NAME_MOTION.animate.transition.duration,
    );
  });
});
