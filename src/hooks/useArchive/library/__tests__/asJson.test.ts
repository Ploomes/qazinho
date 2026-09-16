import { describe, expect, it } from 'vitest';
import { asJson } from '@/hooks/useArchive/library';

const PROJECT = {
  id: 'p1',
  name: 'Shop · staging',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
};

describe('asJson', () => {
  it('writes the file the way an editor would, because a QA reads it too', () => {
    expect(asJson([PROJECT])).toContain('\n  {\n    "id": "p1"');
  });

  it('no projects is an empty list, not an empty file', () => {
    expect(asJson([])).toBe('[]');
  });

  it('the same projects always come out the same, so nothing is written twice', () => {
    expect(asJson([PROJECT])).toBe(asJson([{ ...PROJECT }]));
  });
});
