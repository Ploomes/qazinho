import { describe, expect, it } from 'vitest';
import { SIDEBAR_FLYOUT } from '@/app/components/Sidebar/constants';

describe('SIDEBAR_FLYOUT', () => {
  /** O ponteiro leva um instante para ir do ícone ao painel; fechar antes some com ele. */
  it('waits a beat before closing, short enough not to linger', () => {
    expect(SIDEBAR_FLYOUT.closeMs).toBeGreaterThanOrEqual(100);
    expect(SIDEBAR_FLYOUT.closeMs).toBeLessThanOrEqual(300);
  });

  it('leaves a small gap between the rail and the panel', () => {
    expect(SIDEBAR_FLYOUT.gapPx).toBeGreaterThan(0);
    expect(SIDEBAR_FLYOUT.gapPx).toBeLessThanOrEqual(12);
  });
});
