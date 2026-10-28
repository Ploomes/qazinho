import { describe, expect, it } from 'vitest';
import { ASSISTANT_WAIT } from '@/shared/constants';

describe('ASSISTANT_WAIT', () => {
  /**
   * Um agente desiste de uma ferramenta que passa do timeout dela, e a resposta do QA
   * cairia em ninguém.
   */
  it('lets a tool call outlast the QA confirming on screen', () => {
    expect(ASSISTANT_WAIT.toolMs).toBeGreaterThan(ASSISTANT_WAIT.confirmMs);
  });

  /**
   * O Claude Code derruba uma ferramenta HTTP calada depois de cinco minutos, a menos que
   * o servidor diga quanto ela pode levar.
   */
  it('waits on the QA for no less than a minute', () => {
    expect(ASSISTANT_WAIT.confirmMs).toBeGreaterThanOrEqual(60_000);
  });
});
