import type { IDeviceScreenProps } from '@/modules/Device/components/DevicePanel/components/DeviceScreen/types';
import type { CSSProperties } from 'react';

export const useDeviceScreenViewModel = (props: IDeviceScreenProps) => ({
  className:
    props.stream === null ? 'device-screen' : 'device-screen device-screen--streaming',
  style: { '--screen-ratio': String(props.ratio) } as CSSProperties,
});
