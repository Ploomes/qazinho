import { describe, expect, it } from 'vitest';
import { toPlanKind } from '@/modules/Plan/library';

describe('toPlanKind', () => {
  it('drafts web cases for a URL', () => {
    expect(toPlanKind('web')).toBe('web');
  });

  it('drafts the same cases for Android and for iOS', () => {
    expect(toPlanKind('android')).toBe('mobile');
    expect(toPlanKind('ios')).toBe('mobile');
  });
});
