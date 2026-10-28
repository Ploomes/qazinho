import { describe, expect, it } from 'vitest';
import { formatResetsAt } from '@/shared/components/organisms/Titlebar/library';

const AT = 1_789_575_000;

describe('formatResetsAt', () => {
  it('reads as a clock time, so it never goes stale on screen', () => {
    expect(formatResetsAt({ resetsAt: AT, language: 'en' })).toMatch(/^\d{1,2}:\d{2}/);
  });

  /**
   * A barra de título dizia "reseta 04:00 PM" em português: o horário pegava o idioma da
   * máquina.
   */
  it("tells the time the way the QA's language does, not the machine's", () => {
    expect(formatResetsAt({ resetsAt: AT, language: 'pt' })).not.toMatch(/AM|PM/);
    expect(formatResetsAt({ resetsAt: AT + 12 * 3_600, language: 'en' })).toMatch(
      /AM|PM/,
    );
  });

  it('two windows an hour apart read an hour apart', () => {
    expect(formatResetsAt({ resetsAt: AT, language: 'pt' })).not.toBe(
      formatResetsAt({ resetsAt: AT + 3_600, language: 'pt' }),
    );
  });

  it('an agent that never reported a reset says nothing, not the epoch', () => {
    expect(formatResetsAt({ resetsAt: 0, language: 'pt' })).toBe('');
  });
});
