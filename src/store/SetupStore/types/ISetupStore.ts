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

/** What setting the machine up is doing: the managers an install needs, installs under way, the trackers, and one asked to connect. */
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
