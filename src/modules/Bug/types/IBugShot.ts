/** `src` is the screenshot in hand; `file` is where it stays once the app is closed. */
export interface IBugShot {
  label: string;
  isBad: boolean;
  src: string | null;
  file: string | null;
}
