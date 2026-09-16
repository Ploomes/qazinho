import type { Platform } from './Platform';

/** What the preload exposes to the page as `window.gocrash`. Data and purposeful functions only. */
export interface IGocrashApi {
  platform: Platform;
}
