import { describe, expect, it } from 'vitest';
import { PLAN_QUEUE } from '@/modules/Home/constants';

describe('PLAN_QUEUE', () => {
  /** Uma sprint de quinze histórias abriria quinze agentes de uma vez, na máquina e na conta do QA. */
  it('plans a few stories at once, never the whole sprint', () => {
    expect(PLAN_QUEUE.atOnce).toBeGreaterThan(1);
    expect(PLAN_QUEUE.atOnce).toBeLessThanOrEqual(4);
  });
});
