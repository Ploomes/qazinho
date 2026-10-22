import type {
  ChangeTurn,
  IChangeWork,
  ICheckedTest,
  ICopiedSuite,
  ISuiteChanges,
} from './types';
import type { IBrokenTest, IChangeAnswer } from '@/harness';
import type { IVariableValue } from '@/main/types';
import type {
  IStartSuiteChange,
  ISuiteChange,
  ISuiteChangeFile,
  ISuiteResult,
  ISuiteShipped,
  SuiteChangeAsk,
  SuiteChangeFailure,
  SuiteFailure,
  SuiteShipOutcome,
  SuiteShipWay,
} from '@/shared/types';
import { mkdir, readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { hiddenValues } from '@/main/classes/runs/RunCoordinator/library/hiddenValues';
import { isInside } from '@/main/classes/storage/Archive/library';
import { agentFailure } from '@/main/library/agentFailure';
import { SUITE_CHANGES } from './constants';
import {
  branchNameOf,
  changedPathsOf,
  checkReportOf,
  compareUrlOf,
  failureNotesOf,
  patchFilesOf,
  titleGrepOf,
} from './library';

/** Changes a project's suite with the QA's own agent, in a git worktree of its repository on a branch of its own: the agent edits the copy and runs the tests through QAzinho, QAzinho runs the test again and keeps the diff, and only the QA sends it on. */
export class SuiteChanges {
  private readonly registry: ISuiteChanges['registry'];
  private readonly suites: ISuiteChanges['suites'];
  private readonly git: ISuiteChanges['git'];
  private readonly github: ISuiteChanges['github'];
  private readonly runner: ISuiteChanges['runner'];
  private readonly harness: ISuiteChanges['harness'];
  private readonly tools: ISuiteChanges['tools'];
  private readonly findCommand: ISuiteChanges['findCommand'];
  private readonly values: ISuiteChanges['values'];
  private readonly path: ISuiteChanges['path'];
  private readonly root: string;
  private readonly onEvent: ISuiteChanges['onEvent'];
  private readonly now: () => number;
  private readonly working = new Map<
    string,
    { projectId: string; dir: string; checking: string | null }
  >();
  private readonly stopped = new Set<string>();

  public constructor(props: ISuiteChanges) {
    this.registry = props.registry;
    this.suites = props.suites;
    this.git = props.git;
    this.github = props.github;
    this.runner = props.runner;
    this.harness = props.harness;
    this.tools = props.tools;
    this.findCommand = props.findCommand;
    this.values = props.values;
    this.path = props.path;
    this.root = props.root;
    this.onEvent = props.onEvent;
    this.now = props.now ?? Date.now;
  }

  /** Asks the QA's agent for one change, telling each step as it goes, and answers with the change ready to review, or why it is not. */
  public async start(start: IStartSuiteChange): Promise<ISuiteChange> {
    const folder = this.folderOf(start);
    let change: ISuiteChange = {
      id: start.changeId,
      projectId: start.projectId,
      ask: start.ask,
      startedAt: this.now(),
      endedAt: null,
      status: 'working',
      step: 'copy',
      branch: '',
      base: '',
      commit: '',
      summary: '',
      message: { commit: '', title: '', body: '' },
      files: [],
      check: null,
      failure: null,
      shipped: null,
    };

    this.working.set(start.changeId, {
      projectId: start.projectId,
      dir: '',
      checking: null,
    });

    try {
      await this.keep(change);
      change = await this.make({ start, change, folder });

      if (change.status !== 'ready' && change.files.length === 0)
        await this.release({ folder, change });
    } catch (reason) {
      change = {
        ...change,
        status: 'broke',
        failure: {
          reason: 'other',
          said: reason instanceof Error ? reason.message : String(reason),
        },
      };
    } finally {
      this.working.delete(start.changeId);
      this.stopped.delete(start.changeId);
      this.tools.detachSuite(`${SUITE_CHANGES.scopePrefix}${start.changeId}`);
    }

    const ended: ISuiteChange = { ...change, endedAt: this.now(), step: null };

    await this.keep(ended);

    return ended;
  }

  /** Stops a change where it is: the agent is interrupted, a run of its tests ends, and what it changed so far stays to review or throw away. */
  public stop(changeId: string): void {
    const working = this.working.get(changeId);

    if (working === undefined) return;

    this.stopped.add(changeId);
    this.runner.cancel(`${SUITE_CHANGES.scopePrefix}${changeId}`);

    if (working.checking !== null) this.suites.stopCheck(working.checking);
  }

  /** Hands a line the agent said or did to the page, as the change's own, with its copy of the suite said as `.`. */
  public hear(props: { changeId: string; text: string }): void {
    const working = this.working.get(props.changeId);

    if (working === undefined) return;

    this.onEvent({
      kind: 'line',
      projectId: working.projectId,
      changeId: props.changeId,
      text: working.dir === '' ? props.text : props.text.split(working.dir).join('.'),
    });
  }

  /** A project's changes, the latest first; one left working when QAzinho closed reads as broken. */
  public async changes(projectId: string): Promise<ISuiteChange[]> {
    const folder = join(this.root, projectId, SUITE_CHANGES.changes);

    if (!isInside({ root: this.root, file: folder })) return [];

    const ids = await readdir(folder).catch(() => []);
    const read = await Promise.all(ids.map((id) => this.read(join(folder, id))));

    return read
      .flatMap((change) => (change === null ? [] : [change]))
      .map((change) =>
        change.status === 'working' && !this.working.has(change.id)
          ? {
              ...change,
              status: 'broke' as const,
              step: null,
              failure: change.failure ?? { reason: 'closed' as const },
            }
          : change,
      )
      .sort((one, other) => other.startedAt - one.startedAt);
  }

  /** Sends a change the QA approved: commits it on its branch, pushes it with the QA's own git, and opens the pull request on GitHub when asked; the copy goes once it is pushed. */
  public async ship(props: {
    projectId: string;
    changeId: string;
    way: SuiteShipWay;
  }): Promise<SuiteShipOutcome> {
    const folder = this.folderOf(props);
    const change = await this.read(folder);
    const work = await this.workOf(folder);

    if (change === null || work === null || change.status !== 'ready')
      throw new Error('This change is not ready to send.');

    const ahead = await this.git.run({
      cwd: work.work,
      args: ['rev-list', '--count', `${change.commit}..HEAD`],
    });

    if (!ahead.isOk || ahead.text.trim() === '0') {
      const added = await this.git.run({
        cwd: work.work,
        args: ['add', '-A', '--', ...change.files.map(({ path }) => path)],
      });

      if (!added.isOk) return { isOk: false, step: 'commit', said: added.said, change };

      const committed = await this.git.run({
        cwd: work.work,
        args: ['commit', '-m', change.message.commit || `Fix ${change.ask.test.title}`],
        timeoutMs: SUITE_CHANGES.gitTimeoutMs,
      });

      if (!committed.isOk)
        return { isOk: false, step: 'commit', said: committed.said, change };
    }

    const pushed = await this.git.run({
      cwd: work.work,
      args: ['push', '--set-upstream', 'origin', change.branch],
      timeoutMs: SUITE_CHANGES.gitTimeoutMs,
    });

    if (!pushed.isOk) return { isOk: false, step: 'push', said: pushed.said, change };

    const suite = await this.registry.suiteOf(props.projectId);
    const repository = suite?.repository ?? null;
    let shipped: ISuiteShipped = {
      way: 'branch',
      url: compareUrlOf({ repository, base: change.base, branch: change.branch }),
    };
    let refused: string | null = null;

    if (props.way === 'pull-request' && repository !== null && change.base !== '') {
      const opened = await this.github.api({
        path: `repos/${repository}/pulls`,
        method: 'POST',
        fields: {
          title: change.message.title || `Fix ${change.ask.test.title}`,
          head: change.branch,
          base: change.base,
          body: change.message.body,
        },
        jq: '.html_url',
      });

      if (opened.isOk) shipped = { way: 'pull-request', url: opened.text.trim() };
      else refused = opened.said === '' ? opened.failure : opened.said;
    }

    await this.git.run({
      cwd: work.repo,
      args: ['worktree', 'remove', '--force', work.work],
    });

    const sent: ISuiteChange = { ...change, status: 'shipped', shipped };

    await this.keep(sent);

    return refused === null
      ? { isOk: true, change: sent }
      : { isOk: false, step: 'pull-request', said: refused, change: sent };
  }

  /** Throws a change away: its copy goes, and its branch too unless it was pushed. */
  public async discard(props: {
    projectId: string;
    changeId: string;
  }): Promise<ISuiteChange | null> {
    const folder = this.folderOf(props);
    const change = await this.read(folder);

    if (change === null || this.working.has(props.changeId)) return change;

    await this.release({ folder, change });

    const discarded: ISuiteChange = { ...change, status: 'discarded' };

    await this.keep(discarded);

    return discarded;
  }

  private async release(props: { folder: string; change: ISuiteChange }): Promise<void> {
    const { change } = props;
    const work = await this.workOf(props.folder);

    if (work !== null) {
      await this.git.run({
        cwd: work.repo,
        args: ['worktree', 'remove', '--force', work.work],
      });

      if (change.shipped === null && change.branch !== '')
        await this.git.run({ cwd: work.repo, args: ['branch', '-D', change.branch] });
    }

    await rm(join(props.folder, SUITE_CHANGES.work), { recursive: true, force: true });

    if (work !== null)
      await this.git.run({ cwd: work.repo, args: ['worktree', 'prune'] });
  }

  private async make(props: {
    start: IStartSuiteChange;
    change: ISuiteChange;
    folder: string;
  }): Promise<ISuiteChange> {
    const { start, folder } = props;
    const command = await this.findCommand(start.agentId);

    if (command === null)
      return {
        ...props.change,
        status: 'broke',
        failure: { reason: 'agent-missing', agentId: start.agentId },
      };

    const copied = await this.copy(props);

    if (copied.work === null) return copied.change;

    const values = await this.values(start.projectId);
    const turn = await this.turnOf({
      ...copied,
      work: copied.work,
      start,
      folder,
      command,
      values,
    });

    return turn.kind === 'broke'
      ? turn.change
      : this.close({ start, folder, work: copied.work, values, ...turn });
  }

  private async copy(props: {
    start: IStartSuiteChange;
    change: ISuiteChange;
    folder: string;
  }): Promise<ICopiedSuite> {
    const { start, folder } = props;
    const suitePath = await this.registry.pathOf(start.projectId);
    const broke = (failure: SuiteChangeFailure, change = props.change): ICopiedSuite => ({
      change: { ...change, status: 'broke', failure },
      work: null,
      commits: [],
    });

    if (suitePath === null) return broke({ reason: 'no-suite' });

    const top = await this.git.run({
      cwd: suitePath,
      args: ['rev-parse', '--show-toplevel'],
    });
    const head = top.isOk
      ? await this.git.run({ cwd: top.text.trim(), args: ['rev-parse', 'HEAD'] })
      : top;

    if (!top.isOk || !head.isOk)
      return broke({ reason: 'no-git', said: head.isOk ? '' : head.said });

    const repo = top.text.trim();
    const commit = head.text.trim();
    const [named, log] = await Promise.all([
      this.git.run({ cwd: repo, args: ['rev-parse', '--abbrev-ref', 'HEAD'] }),
      this.git.run({
        cwd: repo,
        args: ['log', `-${String(SUITE_CHANGES.commits)}`, '--format=%s'],
      }),
    ]);
    const base = named.isOk && named.text.trim() !== 'HEAD' ? named.text.trim() : '';
    const branch = await this.freeBranch({ repo, wanted: branchNameOf(start.ask) });
    const work = join(folder, SUITE_CHANGES.work);
    const change: ISuiteChange = { ...props.change, branch, base, commit };

    await this.keep(change);

    const added = await this.git.run({
      cwd: repo,
      args: ['worktree', 'add', '-b', branch, work, commit],
      timeoutMs: SUITE_CHANGES.gitTimeoutMs,
    });

    if (!added.isOk) return broke({ reason: 'copy', said: added.said }, change);

    const dir = join(work, relative(repo, suitePath));
    const kept: IChangeWork = {
      repo,
      work,
      dir,
      links: await this.link({ repo, suitePath, dir, work }),
    };

    await writeFile(join(folder, SUITE_CHANGES.workFile), JSON.stringify(kept));

    if ((await this.registry.runnerOf(dir)) === null)
      return broke({ reason: 'no-runner' }, change);

    return {
      change,
      work: kept,
      commits: log.isOk
        ? log.text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line !== '')
        : [],
    };
  }

  private async turnOf(props: {
    start: IStartSuiteChange;
    change: ISuiteChange;
    folder: string;
    work: IChangeWork;
    commits: string[];
    command: string;
    values: IVariableValue[];
  }): Promise<ChangeTurn> {
    const { start, folder, work, values } = props;
    const { projectId, changeId, ask } = start;
    const scope = `${SUITE_CHANGES.scopePrefix}${changeId}`;
    let checks = 0;

    this.working.set(changeId, { projectId, dir: work.dir, checking: null });
    this.tools.attachSuite({
      scope,
      runTests: async (call) => {
        checks += 1;

        const checked = await this.checkIn({
          changeId,
          projectId,
          dir: work.dir,
          folder: join(folder, SUITE_CHANGES.checks, String(checks)),
          project: call.project,
          filters: call.tests,
          grep: null,
        });

        this.onEvent({
          kind: 'ran',
          projectId,
          changeId,
          total: checked.tests.length,
          passed: checked.tests.filter(({ result }) => result.status === 'passed').length,
        });

        return { text: checkReportOf({ ...checked, values }), isError: false };
      },
    });

    const mcpConfig = this.tools.mcpConfigFor(scope, SUITE_CHANGES.toolTimeoutMs);

    if (mcpConfig === null)
      return {
        kind: 'broke',
        change: {
          ...props.change,
          status: 'broke',
          failure: { reason: 'other', said: "QAzinho's own tools are not up." },
        },
      };

    const failed = await this.suites.resultOf({
      projectId,
      runId: ask.runId,
      testId: ask.test.id,
    });
    const suite = await this.registry.suiteOf(projectId);
    const asked = this.harness.change({
      dir: work.dir,
      config: suite?.config ?? 'playwright.config.ts',
      projects: start.projects,
      branch: props.change.branch,
      base: props.change.base,
      commit: props.change.commit,
      commits: props.commits,
      broken: await this.brokenOf({ ask, failed, values }),
      readDirs: [
        work.work,
        join(folder, SUITE_CHANGES.checks),
        ...(failed === null ? [] : [failed.folder]),
      ],
      language: start.language,
    });
    const change: ISuiteChange = { ...props.change, step: 'agent' };

    await this.keep(change);

    const turn = await this.runner.ask({
      workspaceId: scope,
      agentId: start.agentId,
      command: props.command,
      model: start.model,
      sessionId: null,
      prompt: asked.prompt,
      schema: asked.schema,
      systemPrompt: asked.systemPrompt,
      mcpConfig,
      tools: asked.tools,
      allowedTools: asked.allowedTools,
      readDirs: asked.readDirs,
      writeDir: work.work,
      env: { PATH: await this.path(), CI: '1' },
    });

    if (this.stopped.has(changeId)) return { kind: 'answered', change, answer: null };

    return turn.isError
      ? {
          kind: 'broke',
          change: {
            ...change,
            status: 'broke',
            failure: {
              reason: 'agent',
              failure: agentFailure(turn) ?? { reason: 'agent-silent' },
            },
          },
        }
      : { kind: 'answered', change, answer: this.harness.readChange(turn.text) };
  }

  private async close(props: {
    start: IStartSuiteChange;
    change: ISuiteChange;
    folder: string;
    work: IChangeWork;
    values: IVariableValue[];
    answer: IChangeAnswer | null;
  }): Promise<ISuiteChange> {
    const { start, folder, work, values, answer } = props;
    const { projectId, changeId, ask } = start;
    const change: ISuiteChange = {
      ...props.change,
      step: 'check',
      summary: hiddenValues({ text: answer?.summary ?? '', values }),
      message: {
        commit: answer?.commit ?? '',
        title: answer?.title ?? '',
        body: answer?.body ?? '',
      },
    };

    await this.keep(change);

    const files = await this.filesOf({ work, values });

    if (answer === null) return { ...change, status: 'stopped', files };

    if (answer.outcome === 'app-bug') return { ...change, status: 'app-bug', files };

    if (files.length === 0)
      return {
        ...change,
        status: 'gave-up',
        files,
        failure: answer.outcome === 'changed' ? { reason: 'no-change' } : null,
      };

    if (answer.outcome === 'gave-up') return { ...change, status: 'gave-up', files };

    const verified = await this.checkIn({
      changeId,
      projectId,
      dir: work.dir,
      folder: join(folder, SUITE_CHANGES.checks, SUITE_CHANGES.finalCheck),
      project: ask.test.project,
      filters: [ask.test.file],
      grep: titleGrepOf(ask.test.title),
    });
    const check =
      verified.tests.find(({ result }) => result.title === ask.test.title)?.result ??
      verified.tests[0]?.result ??
      null;

    return {
      ...change,
      status: this.stopped.has(changeId) ? 'stopped' : 'ready',
      files,
      check,
    };
  }

  private async brokenOf(props: {
    ask: SuiteChangeAsk;
    failed: { result: ISuiteResult; folder: string } | null;
    values: IVariableValue[];
  }): Promise<IBrokenTest> {
    const { ask, failed } = props;

    return {
      title: ask.test.title,
      file: ask.test.file,
      line: ask.test.line,
      project: ask.test.project,
      path: ask.test.path,
      error: failed?.result.error ?? 'QAzinho kept no error of this test.',
      notes:
        failed === null
          ? ''
          : hiddenValues({
              text: await this.notesOf({ folder: failed.folder, result: failed.result }),
              values: props.values,
            }),
      screenshots:
        failed === null
          ? []
          : failed.result.attachments
              .filter(({ contentType }) => contentType.startsWith('image/'))
              .map(({ file }) => join(failed.folder, file)),
    };
  }

  private async checkIn(props: {
    changeId: string;
    projectId: string;
    dir: string;
    folder: string;
    project: string;
    filters: string[];
    grep: string | null;
  }): Promise<{ tests: ICheckedTest[]; failure: SuiteFailure | null; said: string }> {
    const working = this.working.get(props.changeId);

    if (working !== undefined) working.checking = props.folder;

    try {
      const check = await this.suites.check({
        projectId: props.projectId,
        path: props.dir,
        project: props.project,
        filters: props.filters,
        grep: props.grep,
        folder: props.folder,
      });
      const tests = await Promise.all(
        check.results.map(async (result) => ({
          result,
          notes: await this.notesOf({ folder: props.folder, result }),
          screenshots: result.attachments
            .filter(({ contentType }) => contentType.startsWith('image/'))
            .map(({ file }) => join(props.folder, file)),
        })),
      );

      return { tests, failure: check.failure, said: check.said };
    } finally {
      if (working !== undefined) working.checking = null;
    }
  }

  private async notesOf(props: {
    folder: string;
    result: ISuiteResult;
  }): Promise<string> {
    const context = props.result.attachments.find(({ name }) => name === 'error-context');

    if (context === undefined) return '';

    const text = await readFile(join(props.folder, context.file), 'utf8').catch(() => '');

    return failureNotesOf(text).slice(0, SUITE_CHANGES.notesChars);
  }

  private async filesOf(props: {
    work: IChangeWork;
    values: IVariableValue[];
  }): Promise<ISuiteChangeFile[]> {
    const { work } = props;
    const status = await this.git.run({
      cwd: work.work,
      args: ['status', '--porcelain=v1', '-z', '--untracked-files=all'],
    });

    if (!status.isOk) return [];

    const paths = changedPathsOf(status.text).filter(
      ({ path }) =>
        !work.links.some((link) => path === link || path.startsWith(`${link}/`)),
    );

    if (paths.length === 0) return [];

    const untracked = paths
      .filter(({ status: changed }) => changed === 'untracked')
      .map(({ path }) => path);

    if (untracked.length > 0)
      await this.git.run({
        cwd: work.work,
        args: ['add', '--intent-to-add', '--', ...untracked],
      });

    const diff = await this.git.run({
      cwd: work.work,
      args: [
        '-c',
        'core.quotePath=false',
        'diff',
        '--no-color',
        '--no-ext-diff',
        '--find-renames',
        '--',
        ...paths.map(({ path }) => path),
      ],
    });

    return diff.isOk
      ? patchFilesOf(hiddenValues({ text: diff.text, values: props.values }))
      : [];
  }

  private async link(props: {
    repo: string;
    suitePath: string;
    dir: string;
    work: string;
  }): Promise<string[]> {
    const runner = await this.registry.runnerOf(props.suitePath);
    const links: string[] = [];
    const place = async (at: { from: string; to: string }) => {
      if (
        await symlink(at.from, at.to).then(
          () => true,
          () => false,
        )
      )
        links.push(relative(props.work, at.to));
    };

    if (runner !== null) {
      const modules = dirname(dirname(dirname(runner.cli)));
      const owner = relative(props.repo, dirname(modules));

      await place({
        from: modules,
        to: join(
          owner.startsWith('..') || isAbsolute(owner)
            ? props.dir
            : join(props.work, owner),
          'node_modules',
        ),
      });
    }

    for (const name of SUITE_CHANGES.envFiles) {
      const file = join(props.suitePath, name);

      if ((await stat(file).catch(() => null))?.isFile() === true)
        await place({ from: file, to: join(props.dir, name) });
    }

    return links;
  }

  private async freeBranch(props: { repo: string; wanted: string }): Promise<string> {
    for (let tries = 1; tries <= SUITE_CHANGES.freeBranchTries; tries += 1) {
      const name = tries === 1 ? props.wanted : `${props.wanted}-${String(tries)}`;
      const taken = await this.git.run({
        cwd: props.repo,
        args: ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`],
      });

      if (!taken.isOk) return name;
    }

    return `${props.wanted}-${String(this.now())}`;
  }

  private folderOf(props: { projectId: string; changeId: string }): string {
    const changes = join(this.root, props.projectId, SUITE_CHANGES.changes);
    const folder = join(changes, props.changeId);

    if (
      !isInside({ root: this.root, file: changes }) ||
      !isInside({ root: changes, file: folder })
    )
      throw new Error('There is no such change.');

    return folder;
  }

  private async keep(change: ISuiteChange): Promise<void> {
    const folder = this.folderOf({ projectId: change.projectId, changeId: change.id });

    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, SUITE_CHANGES.changeFile), JSON.stringify(change));
    this.onEvent({ kind: 'changed', change });
  }

  private async read(folder: string): Promise<ISuiteChange | null> {
    try {
      const read = JSON.parse(
        await readFile(join(folder, SUITE_CHANGES.changeFile), 'utf8'),
      ) as ISuiteChange;

      return typeof read.id === 'string' && Array.isArray(read.files) ? read : null;
    } catch {
      return null;
    }
  }

  private async workOf(folder: string): Promise<IChangeWork | null> {
    try {
      const read = JSON.parse(
        await readFile(join(folder, SUITE_CHANGES.workFile), 'utf8'),
      ) as IChangeWork;

      return typeof read.work === 'string' && Array.isArray(read.links) ? read : null;
    } catch {
      return null;
    }
  }
}
