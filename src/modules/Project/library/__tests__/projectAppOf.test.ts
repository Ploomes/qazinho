import { describe, expect, it } from 'vitest';
import { projectAppOf } from '@/modules/Project/library';

const WEB = {
  id: 't1',
  kind: 'web' as const,
  label: 'Web',
  value: 'https://www.loja.test/',
};
const ANDROID = {
  id: 't2',
  kind: 'android' as const,
  label: 'Android',
  value: '/b/loja.apk',
};

describe('projectAppOf', () => {
  it('shows a web project by its host, without the scheme or the www', () => {
    expect(projectAppOf([WEB])).toEqual({
      address: 'https://www.loja.test/',
      platform: 'web',
      places: ['loja.test'],
    });
  });

  it('keeps the port of a site on this machine', () => {
    expect(projectAppOf([{ ...WEB, value: 'http://localhost:3000/app' }]).places).toEqual(
      ['localhost:3000'],
    );
  });

  it('names a phone target by its platform, and has no site to ask an icon of', () => {
    expect(projectAppOf([ANDROID])).toEqual({
      address: null,
      platform: 'android',
      places: ['Android'],
    });
  });

  it('lists every place a project runs, each once, the site still giving the icon', () => {
    expect(
      projectAppOf([ANDROID, WEB, { ...WEB, id: 't3', value: 'https://loja.test/x' }]),
    ).toEqual({
      address: 'https://www.loja.test/',
      platform: 'android',
      places: ['Android', 'loja.test'],
    });
  });

  it('falls back to the label of a web target whose address is not a site', () => {
    expect(projectAppOf([{ ...WEB, value: 'not a url' }])).toEqual({
      address: null,
      platform: 'web',
      places: ['Web'],
    });
  });

  it('says nothing about a project with no target yet', () => {
    expect(projectAppOf([])).toEqual({ address: null, platform: null, places: [] });
  });
});
