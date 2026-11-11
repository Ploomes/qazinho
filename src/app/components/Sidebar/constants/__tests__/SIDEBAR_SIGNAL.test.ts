import { describe, expect, it } from 'vitest';
import { SIDEBAR_SIGNAL } from '@/app/components/Sidebar/constants';

describe('SIDEBAR_SIGNAL', () => {
  it('paints what failed in the fail color, and what waits on the QA in attention', () => {
    expect(SIDEBAR_SIGNAL.failed.tone).toBe('var(--fail)');
    expect([SIDEBAR_SIGNAL.asking.tone, SIDEBAR_SIGNAL.paused.tone]).toEqual([
      'var(--attn)',
      'var(--attn)',
    ]);
  });

  /** Uma marca que se mexe sem parar cansa: só a pergunta pisca e só a run pulsa. */
  it('moves only the question and the run that goes', () => {
    expect(
      Object.entries(SIDEBAR_SIGNAL)
        .filter(([, { animation }]) => animation !== 'none')
        .map(([kind]) => kind),
    ).toEqual(['asking', 'running']);
  });
});
