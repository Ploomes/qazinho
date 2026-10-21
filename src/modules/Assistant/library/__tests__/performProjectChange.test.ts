import { describe, expect, it } from 'vitest';
import { performProjectChange } from '@/modules/Assistant/library';
import { fakePort, LOGIN } from './fixtures';

describe('performProjectChange', () => {
  describe('create_project', () => {
    it('creates a project on the targets named, with the repositories it is made of', async () => {
      const { port, state } = fakePort();
      const done = await performProjectChange({
        call: {
          name: 'create_project',
          args: {
            name: 'Banco',
            web: 'banco.com.br',
            ios: '/builds/Banco.app',
            repositories: ['ACME/loja-app'],
          },
        },
        port,
      });

      expect(done).toEqual({
        text: 'Created project p-1760000000000 "Banco" on web https://banco.com.br, ios /builds/Banco.app, made of acme/loja-app. Workspaces can be made in it now.',
        isError: false,
      });
      expect(state.projects.at(-1)).toEqual({
        id: 'p-1760000000000',
        name: 'Banco',
        targets: [
          { id: 't-web', kind: 'web', label: 'label web', value: 'https://banco.com.br' },
          { id: 't-ios', kind: 'ios', label: 'label ios', value: '/builds/Banco.app' },
        ],
        repositories: [{ owner: 'acme', name: 'loja-app', baseBranch: 'main' }],
      });
    });

    it('does NOT create a project with no target, or with an address that is no address', async () => {
      const { port, did } = fakePort();

      expect(
        await performProjectChange({
          call: { name: 'create_project', args: { name: 'Banco' } },
          port,
        }),
      ).toEqual({
        text: 'A project needs at least one target: a web address, an Android .apk or an iOS simulator .app.',
        isError: true,
      });
      expect(
        (
          await performProjectChange({
            call: {
              name: 'create_project',
              args: { name: 'Banco', web: 'not an address' },
            },
            port,
          })
        ).text,
      ).toBe('"not an address" is not a web address.');
      expect(did).toEqual([]);
    });

    it('does NOT create a project from repositories the QA cannot read, or with GitHub off', async () => {
      const { port, did } = fakePort();

      expect(
        (
          await performProjectChange({
            call: {
              name: 'create_project',
              args: { name: 'Banco', web: 'banco.test', repositories: ['acme/secret'] },
            },
            port,
          })
        ).text,
      ).toBe('The QA cannot read acme/secret on GitHub, or it does not exist.');

      const off = fakePort({ state: { integrations: [] } });

      expect(
        (
          await performProjectChange({
            call: {
              name: 'create_project',
              args: { name: 'Banco', web: 'banco.test', repositories: ['acme/loja-app'] },
            },
            port: off.port,
          })
        ).text,
      ).toBe(
        'GitHub is not connected to QAzinho: connect it first with connect_integration.',
      );
      expect([...did, ...off.did]).toEqual([]);
    });
  });

  describe('update_project', () => {
    it('renames a project and sets a target, keeping the ids its workspaces point at', async () => {
      const { port, state } = fakePort();

      expect(
        await performProjectChange({
          call: {
            name: 'update_project',
            args: { project: 'p1', name: 'Loja nova', web: 'https://nova.test' },
          },
          port,
        }),
      ).toEqual({
        text: 'Changed p1: renamed it "Loja nova", set its web target to https://nova.test.',
        isError: false,
      });
      expect(state.projects[0]?.targets[0]).toEqual({
        id: 't1',
        kind: 'web',
        label: 'label web',
        value: 'https://nova.test',
      });
    });

    it('does NOT remove a target a workspace tests on', async () => {
      const { port, did } = fakePort();

      expect(
        await performProjectChange({
          call: { name: 'update_project', args: { project: 'p1', android: '' } },
          port,
        }),
      ).toEqual({
        text: 'w2 "Login" tests on the android target of p1: delete that workspace first, or keep the target.',
        isError: true,
      });
      expect(did).toEqual([]);
    });

    it('removes a target nobody tests on, but never the last one', async () => {
      const { port, state } = fakePort({ state: { workspaces: [] } });

      expect(
        (
          await performProjectChange({
            call: { name: 'update_project', args: { project: 'p1', android: '' } },
            port,
          })
        ).text,
      ).toBe('Changed p1: removed its android target.');
      expect(state.projects[0]?.targets.map(({ kind }) => kind)).toEqual(['web']);
      expect(
        await performProjectChange({
          call: { name: 'update_project', args: { project: 'p1', web: '' } },
          port,
        }),
      ).toMatchObject({ isError: true });
    });

    it('says nothing changed, and refuses an empty name', async () => {
      const { port } = fakePort();

      expect(
        await performProjectChange({
          call: { name: 'update_project', args: { project: 'p1', name: 'Lojinha' } },
          port,
        }),
      ).toEqual({
        text: 'Nothing changed on p1: it already reads that way.',
        isError: false,
      });
      expect(
        await performProjectChange({
          call: { name: 'update_project', args: { project: 'p1', name: '  ' } },
          port,
        }),
      ).toEqual({ text: 'A project needs a name.', isError: true });
    });
  });

  describe('link_repository', () => {
    it('links a repository against its default branch, or a base that exists', async () => {
      const { port, state } = fakePort();

      expect(
        (
          await performProjectChange({
            call: {
              name: 'link_repository',
              args: {
                project: 'p1',
                repository: 'https://github.com/acme/loja-app',
                base: 'release',
              },
            },
            port,
          })
        ).text,
      ).toBe(
        'Linked acme/loja-app to p1 "Lojinha", its changes measured against release. /code in a workspace\'s chat plans from it now.',
      );
      expect(state.projects[0]?.repositories.at(-1)).toEqual({
        owner: 'acme',
        name: 'loja-app',
        baseBranch: 'release',
      });
    });

    it('does NOT link a base the repository does not have, nor one already linked twice', async () => {
      const { port, did } = fakePort();

      expect(
        await performProjectChange({
          call: {
            name: 'link_repository',
            args: { project: 'p1', repository: 'acme/loja-app', base: 'nope' },
          },
          port,
        }),
      ).toEqual({ text: 'acme/loja-app has no branch "nope".', isError: true });
      expect(
        await performProjectChange({
          call: {
            name: 'link_repository',
            args: { project: 'p1', repository: 'ACME/LOJA-WEB' },
          },
          port,
        }),
      ).toEqual({ text: 'acme/loja-web is already linked to p1.', isError: false });
      expect(did).toEqual([]);
    });

    it('says why GitHub would not list the repositories', async () => {
      const { port } = fakePort({
        repositories: { isListed: false, failure: 'signed-out' },
      });

      expect(
        (
          await performProjectChange({
            call: {
              name: 'link_repository',
              args: { project: 'p1', repository: 'acme/x' },
            },
            port,
          })
        ).text,
      ).toBe('GitHub did not list the repositories: the GitHub CLI is signed out.');
    });
  });

  describe('unlink_repository', () => {
    it('unlinks a repository the project has', async () => {
      const { port, state } = fakePort();

      expect(
        (
          await performProjectChange({
            call: {
              name: 'unlink_repository',
              args: { project: 'p1', repository: 'acme/loja-web' },
            },
            port,
          })
        ).text,
      ).toBe('Unlinked acme/loja-web from p1 "Lojinha".');
      expect(state.projects[0]?.repositories).toEqual([]);
    });

    it('names the repositories there are when asked for another', async () => {
      const { port } = fakePort();

      expect(
        await performProjectChange({
          call: {
            name: 'unlink_repository',
            args: { project: 'p1', repository: 'acme/x' },
          },
          port,
        }),
      ).toEqual({
        text: 'p1 has no repository "acme/x". It has acme/loja-web.',
        isError: true,
      });
    });
  });

  describe('list_repositories', () => {
    it("lists the QA's repositories with their default branch", async () => {
      const { port } = fakePort();

      expect(
        await performProjectChange({
          call: { name: 'list_repositories', args: {} },
          port,
        }),
      ).toEqual({
        text: [
          'The QA can read 2 repositories on GitHub:',
          '- acme/loja-web (private), default branch develop',
          '- acme/loja-app, default branch main',
        ].join('\n'),
        isError: false,
      });
    });
  });

  it('keeps the workspace fixture on the Android target', () => {
    expect(LOGIN.targetId).toBe('t-android');
  });
});
