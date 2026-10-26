import { describe, expect, it } from 'vitest';
import { proLinkOf } from '@/main/library';

const LINK = {
  orgSlug: 'loja-online',
  projectId: 'p-1a2b',
  workspaceId: 'w_3c4d',
};

describe('proLinkOf', () => {
  it('reads the plan a link from QAzinho Pro names', () => {
    expect(
      proLinkOf('qazinho://open?org=loja-online&project=p-1a2b&workspace=w_3c4d'),
    ).toEqual(LINK);
  });

  it('reads it as Windows hands it over, with a slash before the query', () => {
    expect(
      proLinkOf('qazinho://open/?org=loja-online&project=p-1a2b&workspace=w_3c4d'),
    ).toEqual(LINK);
  });

  it('takes no other scheme, action or address that does not read', () => {
    expect(
      proLinkOf('https://open?org=loja-online&project=p-1a2b&workspace=w_3c4d'),
    ).toBeNull();
    expect(
      proLinkOf('qazinho://delete?org=loja-online&project=p-1a2b&workspace=w_3c4d'),
    ).toBeNull();
    expect(proLinkOf('--inspect=9229')).toBeNull();
    expect(proLinkOf('')).toBeNull();
  });

  it('takes no org or id that is not a name, so none can reach outside its folder', () => {
    expect(
      proLinkOf('qazinho://open?org=loja-online&project=..%2F..%2Fetc&workspace=w_3c4d'),
    ).toBeNull();
    expect(
      proLinkOf('qazinho://open?org=Loja%20Online&project=p-1a2b&workspace=w_3c4d'),
    ).toBeNull();
    expect(proLinkOf('qazinho://open?org=loja-online&project=p-1a2b')).toBeNull();
  });
});
