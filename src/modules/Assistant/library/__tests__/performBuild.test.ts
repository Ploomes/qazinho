import type { IBuild } from '@/modules/Build/types';
import { describe, expect, it } from 'vitest';
import { performBuild } from '@/modules/Assistant/library';
import { fakePort, PROJECT } from './fixtures';

const BUILT: IBuild = {
  id: 'b-7',
  projectId: 'p1',
  platform: 'android',
  repository: 'acme/loja-web',
  branch: 'develop',
  startedAt: 0,
  phase: 'built',
  step: 'artifact',
  bytes: 0,
  lines: [],
  result: {
    isBuilt: true,
    artifact: '/apps/p1/acme-loja-web-develop-c0ffee1.apk',
    bytes: 9,
    commit: 'c0ffee1',
    summary: '',
  },
};

describe('performBuild', () => {
  describe('build_app', () => {
    it("builds the project's only repository from its base branch, and says the build", () => {
      const { port, did } = fakePort();
      const done = performBuild({
        call: { name: 'build_app', args: { project: 'Lojinha', platform: 'android' } },
        port,
      });

      expect(done).toMatchObject({ isError: false, buildId: 'b-1' });
      expect(done.text).toContain(
        'Started building an Android .apk of acme/loja-web, branch develop, for p1 "Lojinha" (b-1).',
      );
      expect(did).toEqual(['build p1 android acme/loja-web@develop']);
    });

    it('builds the branch named, from the repository named', () => {
      const { port, did } = fakePort({
        state: {
          projects: [
            {
              ...PROJECT,
              repositories: [
                { id: null, owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
                { id: null, owner: 'acme', name: 'loja-app', baseBranch: 'main' },
              ],
            },
          ],
        },
      });

      performBuild({
        call: {
          name: 'build_app',
          args: {
            project: 'p1',
            platform: 'ios',
            repository: 'ACME/loja-app',
            branch: 'feat/cupom',
          },
        },
        port,
      });

      expect(did).toEqual(['build p1 ios acme/loja-app@feat/cupom']);
    });

    it('does NOT guess between repositories, nor build one the project does not have', () => {
      const { port, did } = fakePort({
        state: {
          projects: [
            {
              ...PROJECT,
              repositories: [
                { id: null, owner: 'acme', name: 'loja-web', baseBranch: 'develop' },
                { id: null, owner: 'acme', name: 'loja-app', baseBranch: 'main' },
              ],
            },
          ],
        },
      });

      expect(
        performBuild({
          call: { name: 'build_app', args: { project: 'p1', platform: 'android' } },
          port,
        }).text,
      ).toBe(
        'p1 is made of acme/loja-web, acme/loja-app: say which repository to build.',
      );
      expect(
        performBuild({
          call: {
            name: 'build_app',
            args: { project: 'p1', platform: 'android', repository: 'acme/x' },
          },
          port,
        }).text,
      ).toBe('p1 has no repository "acme/x". It has acme/loja-web, acme/loja-app.');
      expect(did).toEqual([]);
    });

    it('says what is missing first: GitHub, a repository, or the toolchain', () => {
      const offline = fakePort({ state: { integrations: [] } });
      const bare = fakePort({ state: { projects: [{ ...PROJECT, repositories: [] }] } });
      const noXcode = fakePort({ state: { hasXcode: false } });
      const noSdk = fakePort({ state: { hasAndroidSdk: false } });
      const call = (platform: 'android' | 'ios') => ({
        name: 'build_app' as const,
        args: { project: 'p1', platform },
      });

      expect(performBuild({ call: call('android'), port: offline.port }).text).toContain(
        'GitHub is not connected',
      );
      expect(performBuild({ call: call('android'), port: bare.port }).text).toContain(
        'names no repository',
      );
      expect(performBuild({ call: call('ios'), port: noXcode.port }).text).toBe(
        'This machine has no Xcode, which an iOS build needs.',
      );
      expect(performBuild({ call: call('android'), port: noSdk.port }).isError).toBe(
        true,
      );
    });

    it('does NOT start a second build of the same platform while one goes', () => {
      const { port, did } = fakePort({
        state: { builds: [{ ...BUILT, phase: 'working', result: null }] },
      });

      expect(
        performBuild({
          call: { name: 'build_app', args: { project: 'p1', platform: 'android' } },
          port,
        }).text,
      ).toBe(
        'p1 is already building an Android .apk (b-7): build_status says how it goes.',
      );
      expect(did).toEqual([]);
    });
  });

  describe('build_status', () => {
    it('says how each build went or goes, newest first', () => {
      const { port } = fakePort({
        state: {
          builds: [
            {
              ...BUILT,
              id: 'b-9',
              phase: 'working',
              step: 'agent',
              lines: ['$ ./gradlew assembleRelease'],
              result: null,
            },
            BUILT,
            {
              ...BUILT,
              id: 'b-3',
              platform: 'ios',
              phase: 'failed',
              result: {
                isBuilt: false,
                failure: { reason: 'no-artifact', said: 'Faltou o CocoaPods.' },
              },
            },
          ],
        },
      });

      expect(
        performBuild({ call: { name: 'build_status', args: {} }, port }).text.split('\n'),
      ).toEqual([
        'The builds, newest first:',
        '- b-9: an Android .apk of acme/loja-web (develop) for p1, going: the agent is building it, last: $ ./gradlew assembleRelease',
        '- b-7: an Android .apk of acme/loja-web (develop) for p1, built: acme-loja-web-develop-c0ffee1.apk',
        '- b-3: an iOS .app for the simulator of acme/loja-web (develop) for p1, made nothing: it made nothing QAzinho can run: Faltou o CocoaPods.',
      ]);
    });

    it('says when no build has started, and only lists the project asked for', () => {
      const { port } = fakePort({ state: { builds: [{ ...BUILT, projectId: 'p9' }] } });

      expect(
        performBuild({ call: { name: 'build_status', args: { project: 'p1' } }, port })
          .text,
      ).toBe('No build has started since QAzinho opened.');
    });
  });
});
