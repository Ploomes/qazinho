import type { IGocrashApi, Platform } from '@/types';

/** A bridge like the preload's, for a test that needs the page to have one. */
export function fakeGocrashApi(platform: Platform): IGocrashApi {
  return {
    platform,
    detectAgents: () => Promise.resolve([]),
    detectDeviceTools: () =>
      Promise.resolve({
        androidSdk: { isFound: false, path: null },
        xcode: { isFound: false, path: null },
      }),
    readResources: () =>
      Promise.resolve({ cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] }),
  };
}
