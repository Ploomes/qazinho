import type { InstallState } from '@/modules/Setup/types';
import type {
  IInstallResult,
  IIntegrationStatus,
  IMachineCheck,
  InstallableId,
  IntegrationId,
  ISetupEvent,
} from '@/types';

/** What setting the machine up is doing: the managers an install needs, installs under way, and trackers. */
export interface ISetupStore {
  managers: IMachineCheck['managers'] | null;
  isChecking: boolean;
  installs: Partial<Record<InstallableId, InstallState>>;
  integrations: IIntegrationStatus[];
  startChecking: () => void;
  landCheck: (managers: IMachineCheck['managers']) => void;
  startInstall: (item: InstallableId) => void;
  followInstall: (event: ISetupEvent) => void;
  finishInstall: (props: { item: InstallableId; result: IInstallResult }) => void;
  setIntegrations: (integrations: IIntegrationStatus[]) => void;
  landIntegration: (status: IIntegrationStatus) => void;
  dropIntegration: (id: IntegrationId) => void;
}
