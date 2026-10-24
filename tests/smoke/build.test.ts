import type { IBuildEvent } from '@/shared/types';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { AppBuilder } from '@/main/classes/builds/AppBuilder';
import { GithubCli } from '@/main/classes/integrations/GithubCli';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { Harness } from '@salve-software/qazinho-harness';

const COMMIT = 'c0ffee0000000000000000000000000000000002';

/** gh as QAzinho calls it for a build: the branch pinned to a commit, then the commit as a tarball. */
const FAKE_GH = String.raw`#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
LAST="$${'{@: -1}'}"
case "$LAST" in
  repos/acme/loja-app/commits/main) echo '${COMMIT}' ;;
  repos/acme/loja-app/tarball/${COMMIT}) tar -czf - -C "$ROOT/repo" acme-loja-app-c0ffee0 ;;
  *) echo '{"message":"Not Found"}'; echo "gh: Not Found (HTTP 404)" >&2; exit 1 ;;
esac
`;

/**
 * Claude Code as the builder: it says what it runs on the stream, writes the release APK where a
 * React Native build leaves it, and answers in the schema, after checking it got the folder, the
 * SDK and the JDK it was handed.
 */
const FAKE_AGENT = String.raw`#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const argv = process.argv.slice(2);
process.stdin.resume();
process.stdin.on('end', () => {
  const dir = argv[argv.indexOf('--add-dir') + 1];
  const say = (line) => console.log(JSON.stringify({ ...line, session_id: 's-1' }));
  const ready = fs.existsSync(path.join(dir, 'package.json')) && process.env.ANDROID_HOME === '/sdk' && process.env.JAVA_HOME === '/jdk' && process.env.CI === '1';
  say({ type: 'assistant', message: { content: [{ type: 'text', text: 'React Native, then.' }, { type: 'tool_use', name: 'Bash', input: { command: 'cd ' + dir + '/android && ./gradlew assembleRelease' } }] } });
  const apk = path.join(dir, 'android/app/build/outputs/apk/release/app-release.apk');
  if (ready) {
    fs.mkdirSync(path.dirname(apk), { recursive: true });
    fs.writeFileSync(apk, Buffer.concat([Buffer.from('PK\u0003\u0004'), Buffer.alloc(2048)]));
  }
  say({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'StructuredOutput', input: { artifact: ready ? apk : '', summary: 'Built the release APK.', failure: ready ? '' : 'The machine was not set up.' } }] } });
  say({ type: 'result', subtype: 'success', is_error: false, result: '', total_cost_usd: 0.01 });
});
`;

async function bench() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-build-'));
  const app = join(root, 'repo', 'acme-loja-app-c0ffee0');

  await mkdir(join(app, 'android'), { recursive: true });
  await writeFile(
    join(app, 'package.json'),
    '{"name":"loja-app","dependencies":{"react-native":"0.76.0"}}',
  );
  await writeFile(join(app, 'android', 'gradlew'), '#!/bin/sh\n');
  await writeFile(join(root, 'gh'), FAKE_GH);
  await writeFile(join(root, 'claude'), FAKE_AGENT);
  await chmod(join(root, 'gh'), 0o755);
  await chmod(join(root, 'claude'), 0o755);

  const events: IBuildEvent[] = [];
  const github = new GithubCli({
    directories: () => Promise.resolve([root, '/usr/bin', '/bin']),
    onProgress: () => undefined,
  });
  let builder: AppBuilder | null = null;
  const runner = new AgentRunner({
    owners: new ProcessOwners(),
    folder: join(root, 'agent-home'),
    onEvent: (event) => {
      const buildId = event.workspaceId.replace('~build:', '');

      if (event.kind === 'text' || event.kind === 'action')
        builder?.hear({ buildId, text: event.text });
    },
  });

  builder = new AppBuilder({
    github,
    runner,
    harness: new Harness(),
    root: join(root, 'builds'),
    findCommand: () => Promise.resolve(join(root, 'claude')),
    machine: () =>
      Promise.resolve({
        androidSdk: '/sdk',
        javaHome: '/jdk',
        hasXcode: false,
        path: `${process.env.PATH ?? ''}`,
      }),
    readPlist: () => Promise.resolve(null),
    onEvent: (event) => {
      events.push(event);
    },
  });

  return { builder, root, events };
}

describe('a build through a fake gh and a fake agent', () => {
  it('unpacks the branch, builds it, and keeps the APK for the project', async () => {
    const { builder, root, events } = await bench();
    const result = await builder.start({
      buildId: 'b1',
      projectId: 'p1',
      platform: 'android',
      repository: { owner: 'acme', name: 'loja-app' },
      branch: 'main',
      agentId: 'claude-code',
      model: '',
      language: 'en',
    });
    const kept = join(root, 'builds', 'apps', 'p1', 'acme-loja-app-main-c0ffee0.apk');

    expect(result).toEqual({
      isBuilt: true,
      artifact: kept,
      bytes: 2052,
      commit: COMMIT,
      summary: 'Built the release APK.',
    });
    expect((await readFile(kept)).subarray(0, 2).toString('latin1')).toBe('PK');
    expect(existsSync(join(root, 'builds', 'work', 'b1'))).toBe(false);
    expect(
      events
        .filter(({ kind }) => kind === 'line')
        .map((event) => (event.kind === 'line' ? event.text : '')),
    ).toEqual(['React Native, then.', '$ cd ./android && ./gradlew assembleRelease']);
  }, 60_000);

  it('says GitHub did not find a branch that is not there', async () => {
    const { builder } = await bench();

    expect(
      await builder.start({
        buildId: 'b2',
        projectId: null,
        platform: 'android',
        repository: { owner: 'acme', name: 'loja-app' },
        branch: 'gone',
        agentId: 'claude-code',
        model: '',
        language: 'en',
      }),
    ).toEqual({ isBuilt: false, failure: { reason: 'code', failure: 'not-found' } });
  }, 60_000);
});
