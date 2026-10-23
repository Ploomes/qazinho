import type { IAppState } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';

const INTEGRATION_NAMES = { github: 'GitHub', jira: 'Jira' } as const;

function nameOf(props: { items: { id: string; name: string }[]; ref: string }): string {
  return props.items.find(({ id }) => id === props.ref.trim())?.name ?? props.ref.trim();
}

/** What a tool call touches, in the words the QA reads on its line: a workspace or project by name, a run, a bug, a repository. */
export function subjectOf(props: { call: AppToolCall; state: IAppState }): string {
  const { call, state } = props;

  switch (call.name) {
    case 'workspace_details':
    case 'open_workspace':
    case 'run_plan':
    case 'explore_app':
    case 'stop_run':
    case 'ask_workspace_chat':
    case 'link_design':
    case 'unlink_design':
    case 'delete_workspace':
      return nameOf({ items: state.workspaces, ref: call.args.workspace });
    case 'run_details':
      return (
        call.args.run ?? nameOf({ items: state.workspaces, ref: call.args.workspace })
      );
    case 'bug_details':
    case 'send_bug':
    case 'dismiss_bug':
      return call.args.bug;
    case 'open_project':
    case 'update_project':
    case 'build_app':
    case 'delete_project':
      return nameOf({ items: state.projects, ref: call.args.project });
    case 'link_repository':
    case 'unlink_repository':
      return call.args.repository;
    case 'create_project':
    case 'create_workspace':
    case 'rename_workspace':
      return call.args.name;
    case 'ask_variables':
      return call.args.variables.map(({ name }) => name).join(', ');
    case 'update_variable':
    case 'delete_variable':
      return call.args.variable;
    case 'connect_integration':
    case 'disconnect_integration':
      return INTEGRATION_NAMES[call.args.integration];
    case 'list_repositories':
    case 'build_status':
    case 'open_settings':
    case 'go_home':
    case 'change_settings':
      return '';
  }
}
