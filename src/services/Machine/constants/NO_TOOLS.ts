import type { IDeviceTools } from '@/shared/types';

export const NO_TOOLS: IDeviceTools = {
  androidSdk: { isFound: false, path: null },
  xcode: { isFound: false, path: null },
  idb: { isFound: false, path: null },
};
