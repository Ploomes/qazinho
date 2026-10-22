import { describe, expect, it } from 'vitest';
import { repositoryOfRemote } from '@/main/classes/automation/SuiteRegistry/library';

describe('repositoryOfRemote', () => {
  it('reads the repository of an SSH remote on GitHub', () => {
    expect(repositoryOfRemote('git@github.com:Ploomes/chat-e2e.git\n')).toBe(
      'Ploomes/chat-e2e',
    );
  });

  it('reads the repository of an HTTPS remote, with or without a login or the .git', () => {
    expect(repositoryOfRemote('https://github.com/Ploomes/chat-e2e')).toBe(
      'Ploomes/chat-e2e',
    );
    expect(repositoryOfRemote('https://qa@github.com/Ploomes/chat-e2e.git')).toBe(
      'Ploomes/chat-e2e',
    );
    expect(repositoryOfRemote('ssh://git@github.com/Ploomes/chat-e2e.git')).toBe(
      'Ploomes/chat-e2e',
    );
  });

  it('keeps a dot inside the name of a repository', () => {
    expect(repositoryOfRemote('git@github.com:acme/web.e2e.git')).toBe('acme/web.e2e');
  });

  it('has no repository for a remote somewhere else than GitHub', () => {
    expect(repositoryOfRemote('git@gitlab.com:acme/e2e.git')).toBeNull();
    expect(repositoryOfRemote('/Users/qa/e2e.git')).toBeNull();
  });
});
