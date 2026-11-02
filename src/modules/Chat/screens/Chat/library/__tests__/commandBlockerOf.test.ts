import { describe, expect, it } from 'vitest';
import { COMMAND_BLOCKERS } from '@/modules/Chat/screens/Chat/constants/COMMAND_BLOCKERS';
import { commandBlockerOf } from '@/modules/Chat/screens/Chat/library/commandBlockerOf';

const READY = {
  isGithubConnected: true,
  isJiraConnected: true,
  isConfluenceOn: true,
  repositoryCount: 1,
};

describe('commandBlockerOf', () => {
  it('finds nothing missing when everything is connected', () => {
    for (const id of [
      'code-plan',
      'jira-plan',
      'confluence-plan',
      'figma-plan',
      'import-plan',
    ] as const)
      expect(commandBlockerOf({ ...READY, id })).toBeNull();
  });

  it('sends a command with no tracker to the integrations', () => {
    expect(
      commandBlockerOf({ ...READY, id: 'jira-plan', isJiraConnected: false }),
    ).toEqual(COMMAND_BLOCKERS.jira);
    expect(
      commandBlockerOf({ ...READY, id: 'confluence-plan', isConfluenceOn: false }),
    ).toEqual(COMMAND_BLOCKERS.confluence);
    expect(COMMAND_BLOCKERS.jira.place).toBe('integrations');
    expect(COMMAND_BLOCKERS.confluence.place).toBe('integrations');
  });

  it('asks for GitHub before the repositories, which need it', () => {
    expect(
      commandBlockerOf({
        ...READY,
        id: 'code-plan',
        isGithubConnected: false,
        repositoryCount: 0,
      }),
    ).toEqual(COMMAND_BLOCKERS.github);
  });

  it('sends a project with no repositories to the code section of that project', () => {
    const blocker = commandBlockerOf({ ...READY, id: 'code-plan', repositoryCount: 0 });

    expect(blocker).toEqual(COMMAND_BLOCKERS.repositories);
    expect(blocker?.place).toBe('project-code');
  });

  /** Cada comando precisa do próprio tracker: o Jira faltando não trava o resto. */
  it('does NOT block a command for what only another one needs', () => {
    const nothing = {
      isGithubConnected: false,
      isJiraConnected: false,
      isConfluenceOn: false,
      repositoryCount: 0,
    };

    expect(commandBlockerOf({ ...nothing, id: 'figma-plan' })).toBeNull();
    expect(commandBlockerOf({ ...nothing, id: 'import-plan' })).toBeNull();
    expect(
      commandBlockerOf({ ...READY, id: 'code-plan', isJiraConnected: false }),
    ).toBeNull();
  });
});
