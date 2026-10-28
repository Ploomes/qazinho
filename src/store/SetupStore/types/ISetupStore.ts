import type { InstallState } from '@/modules/Setup';
import type {
  IInstallResult,
  IIntegrationStatus,
  IMachineCheck,
  IMcpServerStatus,
  InstallableId,
  IntegrationId,
  ISetupEvent,
} from '@/shared/types';

/**
 * O que configurar a máquina está fazendo: os gerenciadores de que uma instalação
 * precisa, instalações em andamento, os trackers, e um pedido para conectar.
 */
export interface ISetupStore {
  managers: IMachineCheck['managers'] | null;
  isChecking: boolean;
  installs: Partial<Record<InstallableId, InstallState>>;
  integrations: IIntegrationStatus[];
  mcpServers: IMcpServerStatus[] | null;
  connectingId: IntegrationId | null;
  startChecking: () => void;
  landCheck: (managers: IMachineCheck['managers']) => void;
  startInstall: (item: InstallableId) => void;
  followInstall: (event: ISetupEvent) => void;
  finishInstall: (props: { item: InstallableId; result: IInstallResult }) => void;
  setIntegrations: (integrations: IIntegrationStatus[]) => void;
  landIntegration: (status: IIntegrationStatus) => void;
  dropIntegration: (id: IntegrationId) => void;
  landMcpServers: (servers: IMcpServerStatus[]) => void;
  askToConnect: (id: IntegrationId) => void;
  clearConnect: () => void;
}
