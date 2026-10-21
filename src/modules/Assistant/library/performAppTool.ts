import type { IAppPort, IToolDone } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import { performBuild } from './performBuild';
import { performOpening } from './performOpening';
import { performProjectChange } from './performProjectChange';
import { performReading } from './performReading';
import { performRemoval } from './performRemoval';
import { performSettingsChange } from './performSettingsChange';
import { performWorkspaceChange } from './performWorkspaceChange';

/** Carries out one of the assistant's app tools through the port, and says what it did for the agent to read. */
export async function performAppTool(props: {
  id: string;
  call: AppToolCall;
  port: IAppPort;
}): Promise<IToolDone> {
  const { id, call, port } = props;

  switch (call.name) {
    case 'workspace_details':
    case 'run_details':
    case 'bug_details':
      return performReading({ call, state: port.read() });
    case 'open_workspace':
    case 'open_project':
    case 'open_settings':
    case 'go_home':
      return performOpening({ call, port });
    case 'create_project':
    case 'update_project':
    case 'link_repository':
    case 'unlink_repository':
    case 'list_repositories':
      return performProjectChange({ call, port });
    case 'create_workspace':
    case 'rename_workspace':
    case 'run_plan':
    case 'stop_run':
      return performWorkspaceChange({ call, port });
    case 'change_settings':
    case 'connect_integration':
    case 'disconnect_integration':
      return performSettingsChange({ id, call, port });
    case 'build_app':
    case 'build_status':
      return performBuild({ call, port });
    case 'delete_workspace':
    case 'delete_project':
      return performRemoval({ id, call, port });
  }
}
