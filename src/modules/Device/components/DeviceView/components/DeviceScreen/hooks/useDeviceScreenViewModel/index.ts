import type { IDeviceScreenProps } from '@/modules/Device/components/DeviceView/components/DeviceScreen/types';
import type { CSSProperties } from 'react';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';

export const useDeviceScreenViewModel = (props: IDeviceScreenProps) => ({
  className:
    props.stream === null ? 'device-screen' : 'device-screen device-screen--streaming',
  style: { '--screen-ratio': String(props.ratio) } as CSSProperties,
  workspaceId: useSelectedWorkspacePart(({ id }) => ({ id }))?.id ?? null,
});
