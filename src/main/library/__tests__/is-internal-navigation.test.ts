import { describe, expect, it } from 'vitest';
import { isInternalNavigation } from '@/main/library';

const DEV_SERVER = 'http://localhost:5173/';
const PACKAGED_PAGE =
  'file:///Applications/gocrash.app/Contents/Resources/app/out/renderer/index.html';

describe('isInternalNavigation', () => {
  it('any path on the dev server origin stays inside the app', () => {
    expect(isInternalNavigation(DEV_SERVER, 'http://localhost:5173/projects/1')).toBe(
      true,
    );
  });

  it('another port on localhost is another origin', () => {
    expect(isInternalNavigation(DEV_SERVER, 'http://localhost:3000/')).toBe(false);
  });

  it('a hash change on the packaged page stays inside the app', () => {
    expect(isInternalNavigation(PACKAGED_PAGE, `${PACKAGED_PAGE}#/projects`)).toBe(true);
  });

  it('another file on disk is outside the app, though every file: URL shares origin', () => {
    expect(isInternalNavigation(PACKAGED_PAGE, 'file:///etc/passwd')).toBe(false);
  });

  it('a javascript: URL is outside the app', () => {
    expect(isInternalNavigation(DEV_SERVER, 'javascript:alert(1)')).toBe(false);
  });

  it('a string that is not a URL is outside the app', () => {
    expect(isInternalNavigation(DEV_SERVER, 'not a url')).toBe(false);
  });
});
