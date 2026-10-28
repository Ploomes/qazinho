// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { PANE_MOTION } from '@/modules/Project/components/ProjectModal/components/ProjectPane/constants';

describe('PANE_MOTION', () => {
  /**
   * Um painel que só sumisse com fade ainda receberia cliques e a barra de busca; o
   * Motion o esconde quando o fade termina.
   */
  it('ends a shut pane out of sight, not only see-through', () => {
    expect(PANE_MOTION.shut).toMatchObject({ opacity: 0, visibility: 'hidden' });
  });

  it('lands an open pane in place, seen whole', () => {
    expect(PANE_MOTION.open).toMatchObject({ opacity: 1, y: 0, visibility: 'visible' });
  });

  it('lets the pane that shuts leave before the one that opens arrives', () => {
    expect(PANE_MOTION.open.transition.delay).toBeGreaterThan(0);
    expect(PANE_MOTION.shut.transition.duration).toBeLessThan(
      PANE_MOTION.open.transition.duration,
    );
  });
});
