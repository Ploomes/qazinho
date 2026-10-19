import type { ShrinkImage } from '@/main/types';
import type { IViewport } from '@/shared/types';

/** Chrome runs on a profile folder the driver owns and empties on open; `shrink` scales what the agent sees without losing hairlines. */
export interface IWebDriver {
  url: string;
  profileDir: string;
  viewport?: IViewport;
  pixelRatio?: number;
  shrink?: ShrinkImage;
}
