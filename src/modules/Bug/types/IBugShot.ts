/**
 * `src` is the screenshot in hand; `file` is where it stays once the app is closed.
 * `isBad` marks the step that broke.
 */
export interface IBugShot {
  isBad: boolean;
  src: string | null;
  file: string | null;
}
