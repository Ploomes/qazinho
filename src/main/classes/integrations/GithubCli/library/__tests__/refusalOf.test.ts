import { describe, expect, it } from 'vitest';
import { refusalOf } from '@/main/classes/integrations/GithubCli/library';

describe('refusalOf', () => {
  it('reads a gh that was never signed in', () => {
    expect(
      refusalOf({
        code: 4,
        said: 'To get started with GitHub CLI, please run:  gh auth login',
      }).failure,
    ).toBe('signed-out');
  });

  it('reads what GitHub refused by its HTTP status', () => {
    expect(refusalOf({ code: 1, said: 'gh: Not Found (HTTP 404)' })).toEqual({
      failure: 'not-found',
      httpStatus: 404,
      said: 'gh: Not Found (HTTP 404)',
    });
    expect(
      refusalOf({ code: 1, said: 'gh: Resource protected by SAML (HTTP 403)' }).failure,
    ).toBe('denied');
  });

  it('reads a machine that cannot reach GitHub', () => {
    expect(
      refusalOf({
        code: 1,
        said: 'error connecting to api.github.com\ncheck your internet connection',
      }).failure,
    ).toBe('unreachable');
  });

  it('keeps the HTTP status of anything else, for whoever asked to read it', () => {
    expect(
      refusalOf({
        code: 1,
        said: 'gh: The diff is taking too long to generate. (HTTP 422)',
      }),
    ).toEqual({
      failure: 'unexpected',
      httpStatus: 422,
      said: 'gh: The diff is taking too long to generate. (HTTP 422)',
    });
  });
});
