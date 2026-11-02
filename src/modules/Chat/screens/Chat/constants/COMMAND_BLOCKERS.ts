import type { ICommandBlocker } from '@/modules/Chat/types';

export const COMMAND_BLOCKERS = {
  github: {
    detailKey: 'COMMANDS.NEEDS_GITHUB',
    tipKey: 'COMMANDS.TIP_GITHUB',
    place: 'integrations',
  },
  repositories: {
    detailKey: 'COMMANDS.NEEDS_REPOSITORIES',
    tipKey: 'COMMANDS.TIP_REPOSITORIES',
    place: 'project-code',
  },
  jira: {
    detailKey: 'COMMANDS.NEEDS_JIRA',
    tipKey: 'COMMANDS.TIP_JIRA',
    place: 'integrations',
  },
  confluence: {
    detailKey: 'COMMANDS.NEEDS_CONFLUENCE',
    tipKey: 'COMMANDS.TIP_CONFLUENCE',
    place: 'integrations',
  },
} as const satisfies Record<string, ICommandBlocker>;
