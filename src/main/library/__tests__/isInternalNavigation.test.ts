import { describe, expect, it } from 'vitest';
import { isInternalNavigation } from '@/main/library';

const DEV_URL = 'http://localhost:5173/';
const PACKAGED_URL =
  'file:///Applications/QAzinho.app/Contents/Resources/app/out/renderer/index.html';

describe('isInternalNavigation', () => {
  it('any path on the dev server origin stays inside the app', () => {
    expect(isInternalNavigation(DEV_URL, 'http://localhost:5173/settings')).toBe(true);
  });

  it('another port on localhost is another origin', () => {
    expect(isInternalNavigation(DEV_URL, 'http://localhost:4173/')).toBe(false);
  });

  it('a hash on the packaged page is still the app', () => {
    expect(isInternalNavigation(PACKAGED_URL, `${PACKAGED_URL}#/settings`)).toBe(true);
  });

  it('another file on disk is not the app', () => {
    expect(isInternalNavigation(PACKAGED_URL, 'file:///etc/passwd')).toBe(false);
  });

  it('a javascript url is never internal', () => {
    expect(isInternalNavigation(DEV_URL, 'javascript:alert(1)')).toBe(false);
  });

  it('a string that is not a url is never internal', () => {
    expect(isInternalNavigation(DEV_URL, 'not a url')).toBe(false);
  });
});
