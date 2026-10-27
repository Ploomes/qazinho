import type { IProOrg } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { publishingOrgOf } from '@/modules/Pro/library';

const LOJA: IProOrg = {
  slug: 'loja',
  name: 'Loja',
  role: 'editor',
  billingStatus: 'active',
};
const LATE: IProOrg = { ...LOJA, slug: 'late', billingStatus: 'blocked' };
const READS: IProOrg = { ...LOJA, slug: 'reads', role: 'reader' };

describe('publishingOrgOf', () => {
  it('keeps the org chosen while the person writes there', () => {
    expect(publishingOrgOf({ orgs: [LOJA, LATE], chosen: 'late' })).toBe('late');
  });

  it('does NOT keep an org the person only reads in', () => {
    expect(publishingOrgOf({ orgs: [READS, LOJA], chosen: 'reads' })).toBe('loja');
  });

  it('starts on the first org paid up, else the first written in, else none', () => {
    expect(publishingOrgOf({ orgs: [LATE, LOJA], chosen: null })).toBe('loja');
    expect(publishingOrgOf({ orgs: [LATE], chosen: null })).toBe('late');
    expect(publishingOrgOf({ orgs: [READS], chosen: null })).toBeNull();
  });
});
