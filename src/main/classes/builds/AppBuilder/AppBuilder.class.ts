import type { IAppBuilder } from './types';
import type {
  BuildFailure,
  BuildPlatform,
  IBuildResult,
  IStartBuild,
} from '@/shared/types';
import { cp, mkdir, open, readdir, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { refPath } from '@/main/classes/integrations/CodeCopies/library/refPath';
import { agentFailure } from '@/main/library/agentFailure';
import { APP_BUILDER } from './constants';
import {
  artifactNameOf,
  buildEnvOf,
  isDevicePlist,
  isInside,
  pickArtifact,
} from './library';

/**
 * Builds the app under test from a branch of its repository: gh brings the code, the QA's
 * own agent builds it, and QAzinho keeps the .apk or .app it made.
 */
export class AppBuilder {
  private readonly github: IAppBuilder['github'];
  private readonly runner: IAppBuilder['runner'];
  private readonly harness: IAppBuilder['harness'];
  private readonly root: string;
  private readonly findCommand: IAppBuilder['findCommand'];
  private readonly machine: IAppBuilder['machine'];
  private readonly readPlist: IAppBuilder['readPlist'];
  private readonly onEvent: IAppBuilder['onEvent'];
  private readonly now: () => number;
  private readonly stopped = new Set<string>();
  private readonly building = new Map<string, string>();

  public constructor(props: IAppBuilder) {
    this.github = props.github;
    this.runner = props.runner;
    this.harness = props.harness;
    this.root = props.root;
    this.findCommand = props.findCommand;
    this.machine = props.machine;
    this.readPlist = props.readPlist;
    this.onEvent = props.onEvent;
    this.now = props.now ?? Date.now;
  }

  /**
   * Builds one app, telling each step as it goes, and answers with the kept .apk or .app,
   * or why there is none.
   */
  public async start(build: IStartBuild): Promise<IBuildResult> {
    const { buildId } = build;
    const work = join(this.root, 'work', buildId);
    const dir = join(work, 'src');

    this.building.set(buildId, dir);

    try {
      return this.ended({ buildId, result: await this.make({ build, dir }) });
    } finally {
      this.building.delete(buildId);
      this.stopped.delete(buildId);
      await rm(work, { recursive: true, force: true });
    }
  }

  /** Stops a build where it is: the agent is interrupted, and nothing it made is kept. */
  public stop(buildId: string): void {
    if (!this.building.has(buildId)) return;

    this.stopped.add(buildId);
    this.runner.cancel(`${APP_BUILDER.scopePrefix}${buildId}`);
  }

  /**
   * Hands a line the building agent said or did to the page, as the build's own, with its
   * folder said as `.`.
   */
  public hear(props: { buildId: string; text: string }): void {
    const dir = this.building.get(props.buildId);

    if (dir !== undefined)
      this.onEvent({
        kind: 'line',
        buildId: props.buildId,
        text: props.text.split(dir).join('.'),
      });
  }

  /**
   * Deletes what builds left half done, for when QAzinho opens after closing in the
   * middle of one.
   */
  public async sweep(): Promise<void> {
    await rm(join(this.root, 'work'), { recursive: true, force: true });
  }

  private ended(props: { buildId: string; result: IBuildResult }): IBuildResult {
    this.onEvent({ kind: 'ended', buildId: props.buildId, result: props.result });

    return props.result;
  }

  private failed(failure: BuildFailure): IBuildResult {
    return { isBuilt: false, failure };
  }

  private async make(props: { build: IStartBuild; dir: string }): Promise<IBuildResult> {
    const { build, dir } = props;
    const { buildId } = build;
    const repository = `${build.repository.owner}/${build.repository.name}`;
    const command = await this.findCommand(build.agentId);

    if (command === null)
      return this.failed({ reason: 'agent-missing', agentId: build.agentId });

    this.onEvent({ kind: 'step', buildId, step: 'code', bytes: 0 });

    const pinned = await this.github.api({
      path: `repos/${repository}/commits/${refPath(build.branch)}`,
      jq: '.sha',
    });

    if (!pinned.isOk) return this.failed({ reason: 'code', failure: pinned.failure });

    const commit = pinned.text.trim();
    let toldAt = this.now();

    await mkdir(dir, { recursive: true });

    const extracted = await this.github.extract({
      path: `repos/${repository}/tarball/${commit}`,
      dir,
      onBytes: (bytes) => {
        if (this.now() - toldAt < APP_BUILDER.progressMs) return;

        toldAt = this.now();
        this.onEvent({ kind: 'step', buildId, step: 'code', bytes });
      },
    });

    if (!extracted.isOk)
      return this.failed({ reason: 'code', failure: extracted.failure });

    if (this.stopped.has(buildId)) return this.failed({ reason: 'stopped' });

    this.onEvent({ kind: 'step', buildId, step: 'agent', bytes: 0 });

    const machine = await this.machine();
    const asked = this.harness.build({
      platform: build.platform,
      dir,
      repository,
      branch: build.branch,
      commit,
      machine,
      language: build.language,
    });
    const turn = await this.runner.ask({
      workspaceId: `${APP_BUILDER.scopePrefix}${buildId}`,
      agentId: build.agentId,
      command,
      model: build.model,
      sessionId: null,
      prompt: asked.prompt,
      schema: asked.schema,
      systemPrompt: asked.systemPrompt,
      tools: asked.tools,
      allowedTools: asked.allowedTools,
      readDirs: asked.readDirs,
      writeDir: dir,
      env: buildEnvOf({ machine, agentId: build.agentId, dir }),
    });

    if (this.stopped.has(buildId)) return this.failed({ reason: 'stopped' });

    if (turn.isError)
      return this.failed({
        reason: 'agent',
        failure: agentFailure(turn) ?? { reason: 'agent-silent' },
      });

    this.onEvent({ kind: 'step', buildId, step: 'artifact', bytes: 0 });

    const answer = this.harness.readBuild(turn.text);
    const artifact = await this.artifactIn({
      dir,
      platform: build.platform,
      said: answer.artifact,
    });

    if (artifact === null)
      return this.failed({ reason: 'no-artifact', said: answer.failure });

    const kept = join(
      this.root,
      'apps',
      build.projectId ?? 'drafts',
      artifactNameOf({
        repository,
        branch: build.branch,
        commit,
        platform: build.platform,
      }),
    );

    await rm(kept, { recursive: true, force: true });
    await mkdir(join(kept, '..'), { recursive: true });
    await cp(artifact, kept, { recursive: true, verbatimSymlinks: true });

    return {
      isBuilt: true,
      artifact: kept,
      bytes: await this.sizeOf(kept),
      commit,
      summary: answer.summary,
    };
  }

  private async artifactIn(props: {
    dir: string;
    platform: BuildPlatform;
    said: string;
  }): Promise<string | null> {
    const { dir, platform, said } = props;

    if (said !== '' && isInside({ dir, path: said })) {
      const path = resolve(dir, said);

      if (await this.runs({ path, platform })) return path;
    }

    const found = await this.walk({ dir, depth: APP_BUILDER.searchDepth });
    const path = pickArtifact({ found, platform });

    return path !== null && (await this.runs({ path, platform })) ? path : null;
  }

  private async runs(props: { path: string; platform: BuildPlatform }): Promise<boolean> {
    const { path, platform } = props;
    const found = await stat(path).catch(() => null);

    if (platform === 'android') {
      if (found?.isFile() !== true || !path.endsWith('.apk')) return false;

      const file = await open(path, 'r');

      try {
        const { buffer } = await file.read({ buffer: Buffer.alloc(2), position: 0 });

        return buffer.toString('latin1') === 'PK';
      } finally {
        await file.close();
      }
    }

    if (found?.isDirectory() !== true || !path.endsWith('.app')) return false;

    const plist = await this.readPlist(join(path, 'Info.plist'));

    return plist !== null && !isDevicePlist(plist);
  }

  private async walk(props: {
    dir: string;
    depth: number;
  }): Promise<{ path: string; modifiedMs: number }[]> {
    if (props.depth === 0) return [];

    const entries = await readdir(props.dir, { withFileTypes: true }).catch(() => []);
    const found: { path: string; modifiedMs: number }[] = [];

    for (const entry of entries) {
      const path = join(props.dir, entry.name);

      if (entry.isDirectory() && entry.name.endsWith('.app'))
        found.push({ path, modifiedMs: (await stat(path)).mtimeMs });
      else if (entry.isFile() && entry.name.endsWith('.apk'))
        found.push({ path, modifiedMs: (await stat(path)).mtimeMs });
      else if (
        entry.isDirectory() &&
        !(APP_BUILDER.skip as readonly string[]).includes(entry.name)
      )
        found.push(...(await this.walk({ dir: path, depth: props.depth - 1 })));
    }

    return found;
  }

  private async sizeOf(path: string): Promise<number> {
    const found = await stat(path);

    if (!found.isDirectory()) return found.size;

    const entries = await readdir(path, { withFileTypes: true });
    let total = 0;

    for (const entry of entries) total += await this.sizeOf(join(path, entry.name));

    return total;
  }
}
