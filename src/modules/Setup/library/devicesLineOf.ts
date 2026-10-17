import type { IDeviceTools } from '@/shared/types';
import type { ParseKeys } from 'i18next';

/** What the Estagiário says about the devices, sentence by sentence, from what this machine has. */
export function devicesLineOf(props: {
  isMac: boolean;
  tools: IDeviceTools;
}): ParseKeys[] {
  const { isMac, tools } = props;
  const android: ParseKeys = tools.androidSdk.isFound
    ? 'SETUP.DEVICES_SAY_ANDROID_READY'
    : 'SETUP.DEVICES_SAY_ANDROID_MISSING';

  if (!isMac) return ['SETUP.DEVICES_SAY_INTRO', android, 'SETUP.DEVICES_SAY_IOS_NO_MAC'];

  const ios: ParseKeys =
    tools.xcode.isFound && tools.idb.isFound
      ? 'SETUP.DEVICES_SAY_IOS_READY'
      : tools.xcode.isFound
        ? 'SETUP.DEVICES_SAY_IOS_NEEDS_IDB'
        : tools.idb.isFound
          ? 'SETUP.DEVICES_SAY_IOS_NEEDS_XCODE'
          : 'SETUP.DEVICES_SAY_IOS_NEEDS_BOTH';

  return ['SETUP.DEVICES_SAY_INTRO', android, ios];
}
