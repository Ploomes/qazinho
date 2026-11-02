import { describe, expect, it } from 'vitest';
import { isConnectedOrg } from '@/modules/Setup/components/OutsideServerCard/library';

describe('isConnectedOrg', () => {
  it('lights up only for the org server, once connected', () => {
    expect(isConnectedOrg({ id: 'org', state: 'connected' })).toBe(true);
    expect(isConnectedOrg({ id: 'org', state: 'needs-auth' })).toBe(false);
    expect(isConnectedOrg({ id: 'figma', state: 'connected' })).toBe(false);
  });
});
