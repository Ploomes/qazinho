import type { DeviceState } from '@/modules/Device/types';

/** A table holds the key, never the sentence: the words come from the locale. */
export const DEVICE_STATE_KEY: Record<DeviceState, string> = {
  off: 'DEVICE.IDLE',
  driving: 'DEVICE.DRIVING',
  holding: 'DEVICE.HOLDING',
  stopped: 'DEVICE.STOPPED',
};
