import type { IViewport } from '@/shared/types';

/** Chrome runs on a profile folder the driver owns and empties on open; its path tells a workspace's Chrome apart. */
export interface IWebDriver {
  url: string;
  profileDir: string;
  viewport?: IViewport;
  pixelRatio?: number;
}
