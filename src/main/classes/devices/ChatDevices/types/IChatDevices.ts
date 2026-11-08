import type { IVariableValue } from '@/main/types';
import type { IViewport } from '@/shared/types';
import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';

/**
 * O que os navegadores do chat precisam: onde guardar os perfis, como abrir um Chrome, a
 * transmissão ao vivo, e quem ouve quando um abre, navega ou fecha.
 */
export interface IChatDevices {
  profilesRoot: string;
  idleMs?: number;
  openDriver: (props: {
    url: string;
    profileDir: string;
    viewport: IViewport;
    values: IVariableValue[];
    onAddress: (url: string) => void;
  }) => IDeviceDriver;
  live: {
    push: (props: { workspaceId: string; jpeg: Buffer; ratio: number }) => void;
    urlFor: (workspaceId: string) => string | null;
    end: (workspaceId: string) => void;
  };
  onChange: (change: {
    workspaceId: string;
    streamUrl: string | null;
    address: string | null;
  }) => void;
}
