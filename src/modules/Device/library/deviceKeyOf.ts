import type { DeviceKey } from '@/shared/types';
import { DEVICE_TOUCH } from '@/modules/Device/constants';

/**
 * A tecla do dispositivo que uma tecla do teclado do QA aperta: só as que não digitam
 * texto; nada para as outras.
 */
export function deviceKeyOf(key: string): DeviceKey | null {
  return DEVICE_TOUCH.keys.find((one) => one === key) ?? null;
}
