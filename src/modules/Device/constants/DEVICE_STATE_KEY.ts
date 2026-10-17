import type { DeviceState } from '@/modules/Device/types';

export const DEVICE_STATE_KEY: Record<DeviceState, string> = {
  off: 'DEVICE.IDLE',
  driving: 'DEVICE.DRIVING',
  holding: 'DEVICE.HOLDING',
  stopped: 'DEVICE.STOPPED',
};
