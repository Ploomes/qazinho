/** A hash change on the packaged page is still the app; any other file on disk is not. */
export function isInternalNavigation(appUrl: string, target: string): boolean {
  let app: URL;
  let url: URL;

  try {
    app = new URL(appUrl);
    url = new URL(target);
  } catch {
    return false;
  }

  if (app.protocol !== url.protocol) return false;

  // Every `file:` origin is the string "null", so origins can never tell two files apart.
  if (app.protocol === 'file:') return app.pathname === url.pathname;

  return app.origin === url.origin;
}
