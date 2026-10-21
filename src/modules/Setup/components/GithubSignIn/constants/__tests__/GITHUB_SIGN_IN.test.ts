import { describe, expect, it } from 'vitest';
import { en } from '@/languages/locales/en';
import { pt } from '@/languages/locales/pt';
import {
  GITHUB_SIGN_IN_FAILURES,
  GITHUB_SIGN_IN_STEPS,
} from '@/modules/Setup/components/GithubSignIn/constants';

const keyOf = (key: string) => key.replace('SETUP.', '') as keyof typeof en.SETUP;

describe('the GitHub sign-in tables', () => {
  it('names every step and every failure in both languages', () => {
    for (const key of [
      ...Object.values(GITHUB_SIGN_IN_STEPS),
      ...Object.values(GITHUB_SIGN_IN_FAILURES),
    ]) {
      expect(en.SETUP[keyOf(key)]).toBeTruthy();
      expect(pt.SETUP[keyOf(key)]).toBeTruthy();
    }
  });

  it('lists the steps in the order gh takes them', () => {
    expect(Object.keys(GITHUB_SIGN_IN_STEPS)).toEqual(['code', 'browser', 'account']);
  });
});
