import { describe, expect, it } from 'vitest';
import { devicesLineOf } from '@/modules/Setup/library';

function tools(found: { android?: boolean; xcode?: boolean; idb?: boolean }) {
  return {
    androidSdk: { isFound: found.android ?? false, path: null },
    xcode: { isFound: found.xcode ?? false, path: null },
    idb: { isFound: found.idb ?? false, path: null },
  };
}

describe('devicesLineOf', () => {
  it('says everything is ready on a Mac that has it all', () => {
    expect(
      devicesLineOf({
        isMac: true,
        tools: tools({ android: true, xcode: true, idb: true }),
      }),
    ).toEqual([
      'SETUP.DEVICES_SAY_INTRO',
      'SETUP.DEVICES_SAY_ANDROID_READY',
      'SETUP.DEVICES_SAY_IOS_READY',
    ]);
  });

  it('owns up that iOS cannot be tested away from a Mac, whatever else is there', () => {
    expect(devicesLineOf({ isMac: false, tools: tools({ android: true }) })).toEqual([
      'SETUP.DEVICES_SAY_INTRO',
      'SETUP.DEVICES_SAY_ANDROID_READY',
      'SETUP.DEVICES_SAY_IOS_NO_MAC',
    ]);
  });

  it('asks only for idb when Xcode is already here', () => {
    expect(devicesLineOf({ isMac: true, tools: tools({ xcode: true }) })).toContain(
      'SETUP.DEVICES_SAY_IOS_NEEDS_IDB',
    );
  });

  it('asks for Xcode when only idb is here, and for both when neither is', () => {
    expect(devicesLineOf({ isMac: true, tools: tools({ idb: true }) })).toContain(
      'SETUP.DEVICES_SAY_IOS_NEEDS_XCODE',
    );
    expect(devicesLineOf({ isMac: true, tools: tools({}) })).toContain(
      'SETUP.DEVICES_SAY_IOS_NEEDS_BOTH',
    );
  });

  it('points to the Android SDK when it is missing', () => {
    expect(devicesLineOf({ isMac: true, tools: tools({}) })).toContain(
      'SETUP.DEVICES_SAY_ANDROID_MISSING',
    );
  });
});
