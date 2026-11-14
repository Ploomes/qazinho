import { describe, expect, it } from 'vitest';
import { MEETING_NAME } from '@/modules/Plan/constants';

describe('MEETING_NAME', () => {
  it('takes a title-sized first line, not a whole sentence someone said', () => {
    expect(MEETING_NAME.longest).toBeGreaterThanOrEqual(30);
    expect(MEETING_NAME.longest).toBeLessThanOrEqual(80);
  });

  it('knows a line someone said by the name and the colon that open it', () => {
    expect(MEETING_NAME.speech.test('Marina (PO): Fechado.')).toBe(true);
    expect(MEETING_NAME.speech.test('Alinhamento do cupom · 14/11')).toBe(false);
  });
});
