import type { ConfirmAction } from '@/modules/Assistant/types';
import type { AppToolCall } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const TOOL_LABELS: Record<
  Exclude<AppToolCall['name'], ConfirmAction>,
  { doing: ParseKeys; done: ParseKeys }
> = {
  workspace_details: {
    doing: 'ASSISTANT.TOOL_WORKSPACE_DETAILS',
    done: 'ASSISTANT.TOOL_WORKSPACE_DETAILS_DONE',
  },
  run_details: {
    doing: 'ASSISTANT.TOOL_RUN_DETAILS',
    done: 'ASSISTANT.TOOL_RUN_DETAILS_DONE',
  },
  bug_details: {
    doing: 'ASSISTANT.TOOL_BUG_DETAILS',
    done: 'ASSISTANT.TOOL_BUG_DETAILS_DONE',
  },
  list_repositories: {
    doing: 'ASSISTANT.TOOL_LIST_REPOSITORIES',
    done: 'ASSISTANT.TOOL_LIST_REPOSITORIES_DONE',
  },
  open_workspace: {
    doing: 'ASSISTANT.TOOL_OPEN_WORKSPACE',
    done: 'ASSISTANT.TOOL_OPEN_WORKSPACE_DONE',
  },
  open_project: {
    doing: 'ASSISTANT.TOOL_OPEN_PROJECT',
    done: 'ASSISTANT.TOOL_OPEN_PROJECT_DONE',
  },
  open_settings: {
    doing: 'ASSISTANT.TOOL_OPEN_SETTINGS',
    done: 'ASSISTANT.TOOL_OPEN_SETTINGS_DONE',
  },
  go_home: { doing: 'ASSISTANT.TOOL_GO_HOME', done: 'ASSISTANT.TOOL_GO_HOME_DONE' },
  create_project: {
    doing: 'ASSISTANT.TOOL_CREATE_PROJECT',
    done: 'ASSISTANT.TOOL_CREATE_PROJECT_DONE',
  },
  update_project: {
    doing: 'ASSISTANT.TOOL_UPDATE_PROJECT',
    done: 'ASSISTANT.TOOL_UPDATE_PROJECT_DONE',
  },
  link_repository: {
    doing: 'ASSISTANT.TOOL_LINK_REPOSITORY',
    done: 'ASSISTANT.TOOL_LINK_REPOSITORY_DONE',
  },
  unlink_repository: {
    doing: 'ASSISTANT.TOOL_UNLINK_REPOSITORY',
    done: 'ASSISTANT.TOOL_UNLINK_REPOSITORY_DONE',
  },
  create_workspace: {
    doing: 'ASSISTANT.TOOL_CREATE_WORKSPACE',
    done: 'ASSISTANT.TOOL_CREATE_WORKSPACE_DONE',
  },
  rename_workspace: {
    doing: 'ASSISTANT.TOOL_RENAME_WORKSPACE',
    done: 'ASSISTANT.TOOL_RENAME_WORKSPACE_DONE',
  },
  run_plan: { doing: 'ASSISTANT.TOOL_RUN_PLAN', done: 'ASSISTANT.TOOL_RUN_PLAN_DONE' },
  stop_run: { doing: 'ASSISTANT.TOOL_STOP_RUN', done: 'ASSISTANT.TOOL_STOP_RUN_DONE' },
  change_settings: {
    doing: 'ASSISTANT.TOOL_CHANGE_SETTINGS',
    done: 'ASSISTANT.TOOL_CHANGE_SETTINGS_DONE',
  },
  connect_integration: {
    doing: 'ASSISTANT.TOOL_CONNECT_INTEGRATION',
    done: 'ASSISTANT.TOOL_CONNECT_INTEGRATION_DONE',
  },
};
