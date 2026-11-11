import { describe, expect, it } from 'vitest';
import { projectMarkOf } from '@/modules/Project/library';

const SITE = 'https://staging.loja.test/';
const ICON = 'data:image/png;base64,iVBORw==';
const WEB_APP = {
  address: SITE,
  platform: 'web' as const,
  places: ['staging.loja.test'],
};

describe('projectMarkOf', () => {
  it('shows the icon of the site once it arrived', () => {
    expect(
      projectMarkOf({ name: 'Loja', app: WEB_APP, icons: { [SITE]: ICON } }),
    ).toEqual({
      kind: 'icon',
      src: ICON,
    });
  });

  it('shows the platform while the icon is on its way, or when the site has none', () => {
    expect(projectMarkOf({ name: 'Loja', app: WEB_APP, icons: {} })).toEqual({
      kind: 'platform',
      platform: 'web',
    });
    expect(
      projectMarkOf({ name: 'Loja', app: WEB_APP, icons: { [SITE]: null } }),
    ).toEqual({
      kind: 'platform',
      platform: 'web',
    });
  });

  it('falls back to the initial of a project with no target', () => {
    expect(
      projectMarkOf({
        name: ' loja',
        app: { address: null, platform: null, places: [] },
        icons: {},
      }),
    ).toEqual({ kind: 'initial', initial: 'L' });
  });
});
