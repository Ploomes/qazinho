/** A hash change on the packaged page is still the app; any other file on disk is not. */
export function isInternalNavigation(appUrl: string, url: string): boolean {
  if (!URL.canParse(url)) return false;

  const app = new URL(appUrl);
  const target = new URL(url);

  // Every file: URL has the origin "null", so for the packaged page the path is what tells.
  if (app.protocol === 'file:') {
    return target.protocol === 'file:' && target.pathname === app.pathname;
  }

  return target.origin === app.origin;
}
