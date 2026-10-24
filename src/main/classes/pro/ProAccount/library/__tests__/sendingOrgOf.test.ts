import type { IProOrg } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { sendingOrgOf } from '@/main/classes/pro/ProAccount/library';

const LOJA: IProOrg = {
  slug: 'loja',
  name: 'Loja',
  role: 'editor',
  billingStatus: 'active',
};
const PARADA: IProOrg = {
  slug: 'parada',
  name: 'Parada',
  role: 'owner',
  billingStatus: 'blocked',
};
const LEITURA: IProOrg = {
  slug: 'leitura',
  name: 'Leitura',
  role: 'reader',
  billingStatus: 'active',
};

describe('sendingOrgOf', () => {
  it('keeps the org the person chose while they still write there', () => {
    expect(sendingOrgOf({ orgs: [LOJA, PARADA], chosen: 'parada' })).toBe('parada');
  });

  it('picks the first org they write in that is paid up, when they chose none', () => {
    expect(sendingOrgOf({ orgs: [PARADA, LOJA], chosen: null })).toBe('loja');
  });

  it('falls back to an org they write in that is blocked, so the block shows', () => {
    expect(sendingOrgOf({ orgs: [LEITURA, PARADA], chosen: null })).toBe('parada');
  });

  it('sends nowhere from an account that only reads, or chose an org it left', () => {
    expect(sendingOrgOf({ orgs: [LEITURA], chosen: 'leitura' })).toBeNull();
    expect(sendingOrgOf({ orgs: [], chosen: 'loja' })).toBeNull();
    expect(sendingOrgOf({ orgs: [LOJA], chosen: 'gone' })).toBe('loja');
  });
});
