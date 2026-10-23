import { describe, expect, it } from 'vitest';
import { asideNameOf } from '@/main/classes/storage/Archive/library';

describe('asideNameOf', () => {
  it('stamps the plan set aside to the second, with no character Windows refuses', () => {
    expect(asideNameOf(new Date('2026-10-23T05:26:07.123Z'))).toBe(
      'plan.unread-20261023-052607.yaml',
    );
  });
});
