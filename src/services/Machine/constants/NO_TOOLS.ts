import type { IDeviceTools } from '@/types';

/** What a page with no bridge behind it knows about this machine: nothing, and it says so. */
export const NO_TOOLS: IDeviceTools = {
  androidSdk: { isFound: false, path: null },
  xcode: { isFound: false, path: null },
};
