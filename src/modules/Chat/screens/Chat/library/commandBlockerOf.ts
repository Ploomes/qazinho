import type { ChatCommandId, ICommandBlocker } from '@/modules/Chat/types';
import { COMMAND_BLOCKERS } from '@/modules/Chat/screens/Chat/constants/COMMAND_BLOCKERS';

/** O que falta para um comando do chat rodar neste projeto, ou nada. */
export function commandBlockerOf(props: {
  id: ChatCommandId;
  isGithubConnected: boolean;
  isJiraConnected: boolean;
  isConfluenceOn: boolean;
  repositoryCount: number;
}): ICommandBlocker | null {
  const { id, isGithubConnected, isJiraConnected, isConfluenceOn, repositoryCount } =
    props;

  if (id === 'jira-plan') return isJiraConnected ? null : COMMAND_BLOCKERS.jira;

  if (id === 'confluence-plan')
    return isConfluenceOn ? null : COMMAND_BLOCKERS.confluence;

  if (id !== 'code-plan') return null;

  if (!isGithubConnected) return COMMAND_BLOCKERS.github;

  return repositoryCount === 0 ? COMMAND_BLOCKERS.repositories : null;
}
