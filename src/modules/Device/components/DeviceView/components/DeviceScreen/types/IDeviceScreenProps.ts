import type { DeviceInput } from '@/shared/types';

export interface IDeviceScreenProps {
  shot: string | null;
  stream: string | null;
  ratio: number;
  fitsWhole?: boolean;
  onTouch?: (input: DeviceInput) => void;
}
