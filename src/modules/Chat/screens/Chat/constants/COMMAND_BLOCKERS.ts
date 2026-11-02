import type { ICommandBlocker } from '@/modules/Chat/types';

export const COMMAND_BLOCKERS = {
  github: {
    tipKey: 'COMMANDS.TIP_GITHUB',
    place: 'integrations',
  },
  repositories: {
    tipKey: 'COMMANDS.TIP_REPOSITORIES',
    place: 'project-code',
  },
  jira: {
    tipKey: 'COMMANDS.TIP_JIRA',
    place: 'integrations',
  },
  confluence: {
    tipKey: 'COMMANDS.TIP_CONFLUENCE',
    place: 'integrations',
  },
} as const satisfies Record<string, ICommandBlocker>;
