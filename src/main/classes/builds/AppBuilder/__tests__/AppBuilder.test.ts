import type { IRunAgent } from '@/main/classes/agents/AgentRunner/types';
import type { GhAnswer } from '@/main/classes/integrations/GithubCli/types';
import type { IAgentTurn, IBuildEvent, IStartBuild } from '@/shared/types';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { AppBuilder } from '@/main/classes/builds/AppBuilder';

const COMMIT = 'c0ffee1234567890abcdef';

const BUILD: IStartBuild = {
  buildId: 'b1',
  projectId: 'p1',
  platform: 'android',
  repository: { owner: 'acme', name: 'loja-app' },
  branch: 'main',
  agentId: 'claude-code',
  model: '',
  language: 'pt',
};

const answered = (answer: {
  artifact: string;
  summary?: string;
  failure?: string;
}): IAgentTurn => ({
  sessionId: 's-1',
  text: JSON.stringify({ summary: '', failure: '', ...answer }),
  usage: null,
  isError: false,
  costUsd: 0.2,
});

/**
 * A builder over a temporary folder. gh pins the branch and unpacks a small app into the copy,
 * and the agent is a function of the copy's folder: it writes what a real build would leave
 * behind, then answers.
 */
async function builderWith(props: {
  build: (dir: string) => Promise<IAgentTurn>;
  pinned?: GhAnswer;
  command?: string | null;
  plists?: Record<string, string>;
}) {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-builds-'));
  const events: IBuildEvent[] = [];
  const asked: IRunAgent[] = [];
  const cancelled: string[] = [];
  const builder = new AppBuilder({
    github: {
      api: () => Promise.resolve(props.pinned ?? { isOk: true, text: `${COMMIT}\n` }),
      extract: async ({ dir }) => {
        await mkdir(join(dir, 'android'), { recursive: true });
        await writeFile(join(dir, 'android', 'gradlew'), '#!/bin/sh\n');

        return { isOk: true, text: '' };
      },
    },
    runner: {
      ask: (run) => {
        asked.push(run);

        return props.build(run.writeDir ?? '');
      },
      cancel: (scope) => {
        cancelled.push(scope);
      },
    },
    harness: new Harness(),
    root,
    findCommand: () =>
      Promise.resolve(props.command === undefined ? '/bin/claude' : props.command),
    machine: () =>
      Promise.resolve({
        androidSdk: '/sdk',
        javaHome: '/jdk',
        hasXcode: true,
        path: '/usr/bin',
      }),
    readPlist: (file) =>
      Promise.resolve(props.plists?.[file.split('/').slice(-2).join('/')] ?? null),
    onEvent: (event) => {
      events.push(event);
    },
  });

  return { builder, root, events, asked, cancelled };
}

async function apk(path: string, bytes = 'PK\u0003\u0004apk') {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, bytes);
}

const roots: string[] = [];

afterEach(() => {
  roots.splice(0);
});

describe('AppBuilder', () => {
  describe('start', () => {
    it('builds from the pinned commit and keeps the apk with the project', async () => {
      const { builder, root, events, asked } = await builderWith({
        build: async (dir) => {
          const made = join(dir, 'android/app/build/outputs/apk/release/app-release.apk');

          await apk(made);

          return answered({ artifact: made, summary: 'Gerei o APK de release.' });
        },
      });
      const result = await builder.start(BUILD);
      const kept = join(root, 'apps', 'p1', 'acme-loja-app-main-c0ffee1.apk');

      expect(result).toEqual({
        isBuilt: true,
        artifact: kept,
        bytes: 7,
        commit: COMMIT,
        summary: 'Gerei o APK de release.',
      });
      expect(await readFile(kept, 'latin1')).toBe('PK\u0003\u0004apk');
      expect(existsSync(join(root, 'work', 'b1'))).toBe(false);
      expect(
        events.map((event) => (event.kind === 'step' ? event.step : event.kind)),
      ).toEqual(['code', 'agent', 'artifact', 'ended']);
      expect(asked[0]).toMatchObject({
        workspaceId: '~build:b1',
        tools: ['Bash', 'Read', 'Grep', 'Glob', 'Edit', 'Write'],
        writeDir: join(root, 'work', 'b1', 'src'),
        readDirs: [join(root, 'work', 'b1', 'src')],
        env: { ANDROID_HOME: '/sdk', JAVA_HOME: '/jdk', CI: '1' },
      });
      expect(asked[0]?.prompt).toContain('commit c0ffee1');
    });

    it('finds the apk the agent left without naming it', async () => {
      const { builder } = await builderWith({
        build: async (dir) => {
          await apk(join(dir, 'android/app/build/outputs/apk/debug/app-debug.apk'));

          return answered({ artifact: '' });
        },
      });

      expect(await builder.start(BUILD)).toMatchObject({ isBuilt: true });
    });

    it('does NOT keep what is no apk, or a file outside the copy', async () => {
      const { builder } = await builderWith({
        build: async (dir) => {
          await apk(join(dir, 'notes.apk'), 'not a zip');

          return answered({ artifact: '/etc/hosts', failure: 'Faltou o Java 17.' });
        },
      });

      expect(await builder.start(BUILD)).toEqual({
        isBuilt: false,
        failure: { reason: 'no-artifact', said: 'Faltou o Java 17.' },
      });
    });

    it('keeps a simulator .app, and turns down one built for a device', async () => {
      const simulator = await builderWith({
        plists: { 'Loja.app/Info.plist': '{"DTPlatformName":"iphonesimulator"}' },
        build: async (dir) => {
          const app = join(dir, 'build/Build/Products/Debug-iphonesimulator/Loja.app');

          await mkdir(app, { recursive: true });
          await writeFile(join(app, 'Loja'), 'binary');

          return answered({ artifact: app });
        },
      });
      const device = await builderWith({
        plists: { 'Loja.app/Info.plist': '{"DTPlatformName":"iphoneos"}' },
        build: async (dir) => {
          const app = join(dir, 'build/Build/Products/Release-iphonesimulator/Loja.app');

          await mkdir(app, { recursive: true });

          return answered({ artifact: app });
        },
      });

      expect(await simulator.builder.start({ ...BUILD, platform: 'ios' })).toMatchObject({
        isBuilt: true,
        artifact: join(simulator.root, 'apps', 'p1', 'acme-loja-app-main-c0ffee1.app'),
        bytes: 6,
      });
      expect(await device.builder.start({ ...BUILD, platform: 'ios' })).toMatchObject({
        isBuilt: false,
        failure: { reason: 'no-artifact' },
      });
    });

    it('says why there was no code, and runs no agent', async () => {
      const { builder, asked } = await builderWith({
        pinned: { isOk: false, failure: 'not-found', httpStatus: 404, said: '' },
        build: () => Promise.reject(new Error('ran')),
      });

      expect(await builder.start(BUILD)).toEqual({
        isBuilt: false,
        failure: { reason: 'code', failure: 'not-found' },
      });
      expect(asked).toEqual([]);
    });

    it('says the agent is missing, or what its failure was', async () => {
      const missing = await builderWith({
        command: null,
        build: () => Promise.reject(new Error('ran')),
      });
      const signedOut = await builderWith({
        build: () =>
          Promise.resolve({
            ...answered({ artifact: '' }),
            isError: true,
            text: 'Not logged in · Please run /login',
          }),
      });

      expect(await missing.builder.start(BUILD)).toEqual({
        isBuilt: false,
        failure: { reason: 'agent-missing', agentId: 'claude-code' },
      });
      expect(await signedOut.builder.start(BUILD)).toEqual({
        isBuilt: false,
        failure: { reason: 'agent', failure: { reason: 'agent-signed-out' } },
      });
    });
  });

  describe('stop', () => {
    it('interrupts the agent and keeps nothing it made', async () => {
      let finish: (turn: IAgentTurn) => void = () => undefined;
      const { builder, cancelled, root } = await builderWith({
        build: async (dir) => {
          await apk(join(dir, 'android/app/build/outputs/apk/debug/app-debug.apk'));

          return new Promise<IAgentTurn>((settle) => {
            finish = settle;
          });
        },
      });
      const building = builder.start(BUILD);

      await new Promise((settle) => setTimeout(settle, 50));
      builder.stop('b1');
      finish(answered({ artifact: '' }));

      expect(await building).toEqual({ isBuilt: false, failure: { reason: 'stopped' } });
      expect(cancelled).toEqual(['~build:b1']);
      expect(existsSync(join(root, 'apps'))).toBe(false);
    });
  });

  describe('hear', () => {
    it('says the build folder as . in what the agent does', async () => {
      let finish: (turn: IAgentTurn) => void = () => undefined;
      const { builder, events, root } = await builderWith({
        build: () =>
          new Promise<IAgentTurn>((settle) => {
            finish = settle;
          }),
      });
      const building = builder.start(BUILD);

      await new Promise((settle) => setTimeout(settle, 50));
      builder.hear({
        buildId: 'b1',
        text: `$ cd ${join(root, 'work', 'b1', 'src')}/android && ls`,
      });
      finish(answered({ artifact: '' }));
      await building;

      expect(events.find(({ kind }) => kind === 'line')).toEqual({
        kind: 'line',
        buildId: 'b1',
        text: '$ cd ./android && ls',
      });
    });

    it('passes on what the agent does only for a build in flight', async () => {
      let finish: (turn: IAgentTurn) => void = () => undefined;
      const { builder, events } = await builderWith({
        build: () =>
          new Promise<IAgentTurn>((settle) => {
            finish = settle;
          }),
      });
      const building = builder.start(BUILD);

      await new Promise((settle) => setTimeout(settle, 50));
      builder.hear({ buildId: 'b1', text: '$ ./gradlew assembleRelease' });
      builder.hear({ buildId: 'b9', text: '$ rm -rf /' });
      finish(answered({ artifact: '' }));
      await building;

      expect(events.filter(({ kind }) => kind === 'line')).toEqual([
        { kind: 'line', buildId: 'b1', text: '$ ./gradlew assembleRelease' },
      ]);
    });
  });

  describe('sweep', () => {
    it('deletes what builds left half done', async () => {
      const { builder, root } = await builderWith({
        build: () => Promise.reject(new Error('ran')),
      });

      await mkdir(join(root, 'work', 'old', 'src'), { recursive: true });
      await builder.sweep();

      expect(existsSync(join(root, 'work'))).toBe(false);
    });
  });
});
