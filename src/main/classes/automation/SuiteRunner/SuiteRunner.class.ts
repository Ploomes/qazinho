import type { ISuiteCheck, ISuiteJob, ISuiteRunner, SuiteReport } from './types';
import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import type {
  IStartSuiteRun,
  ISuiteBatch,
  ISuiteResult,
  ISuiteRun,
  SuiteEvent,
  SuiteFailure,
  SuiteList,
} from '@/shared/types';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';
import { createInterface } from 'node:readline';
import { killTree } from '@/main/classes/agents/AgentRunner/library';
import { isInside } from '@/main/classes/storage/Archive/library';
import { stripAnsi, spawnCommand } from '@/main/library';
import { hiddenValues } from '@salve-software/qazinho-harness/engine';
import { SUITE_REPORTER, SUITE_RUNNER } from './constants';
import { locationOf, suiteReportOf, suiteStatusOf, suiteTestsOf } from './library';

/**
 * Roda as suítes de Playwright do QA com o Playwright próprio delas: lista os testes e os
 * roda por projeto.
 */
export class SuiteRunner {
  private readonly registry: Pick<SuiteRegistry, 'pathOf' | 'runnerOf'>;
  private readonly node: () => Promise<string | null>;
  private readonly env: (projectId: string) => Promise<Record<string, string>>;
  private readonly values: ISuiteRunner['values'];
  private readonly root: string;
  private readonly urlOf: ISuiteRunner['urlOf'];
  private readonly onEvent: (event: SuiteEvent) => void;
  private readonly now: () => number;
  private readonly jobs = new Map<string, ISuiteJob>();
  private readonly checks = new Map<string, ISuiteJob>();

  public constructor(props: ISuiteRunner) {
    this.registry = props.registry;
    this.node = props.node;
    this.env = props.env;
    this.values = props.values;
    this.root = props.root;
    this.urlOf = props.urlOf;
    this.onEvent = props.onEvent;
    this.now = props.now ?? Date.now;
  }

  /**
   * Os testes que a suíte de um projeto guarda, como o Playwright próprio dela os lista,
   * ou por que não conseguiu.
   */
  public async list(projectId: string): Promise<SuiteList> {
    const tools = await this.toolsOf(projectId);

    if (tools.failure !== null)
      return { kind: 'failed', reason: tools.failure, said: '' };

    const folder = join(this.root, projectId);
    const file = join(folder, SUITE_RUNNER.listFile);

    await mkdir(folder, { recursive: true });

    const said = await this.exec({
      command: tools.node,
      args: [tools.cli, 'test', '--list', '--reporter=json'],
      cwd: tools.path,
      env: { ...(await this.env(projectId)), PLAYWRIGHT_JSON_OUTPUT_FILE: file },
    });
    const listed = suiteTestsOf({
      text: await readFile(file, 'utf8').catch(() => ''),
      root: tools.path,
    });

    await rm(file, { force: true });

    return listed === null
      ? { kind: 'failed', reason: 'unreadable', said }
      : { kind: 'listed', ...listed };
  }

  /**
   * Roda a suíte de um projeto batch após batch, um projeto do Playwright cada, e
   * responde com a run quando termina; um projeto já rodando responde com essa run.
   */
  public async run(start: IStartSuiteRun): Promise<ISuiteRun> {
    const going = this.jobs.get(start.projectId);

    if (going !== undefined) return { ...going.run };

    const job: ISuiteJob = {
      run: {
        id: start.runId,
        projectId: start.projectId,
        startedAt: this.now(),
        endedAt: null,
        status: 'running',
        total: start.expected,
        results: [],
        failure: null,
        said: '',
      },
      values: await this.values(start.projectId),
      expected: start.expected,
      counted: 0,
      child: null,
      isStopping: false,
      isBroken: false,
      isQuiet: false,
    };
    const folder = this.folderOf(job.run);

    this.jobs.set(start.projectId, job);
    await mkdir(join(folder, SUITE_RUNNER.output), { recursive: true });
    await this.save(job.run);
    this.onEvent({ kind: 'started', run: { ...job.run } });

    try {
      const tools = await this.toolsOf(start.projectId);

      if (tools.failure !== null) {
        job.run.failure = tools.failure;
        job.isBroken = true;
      } else {
        const reporter = join(this.root, SUITE_REPORTER.file);
        const env = await this.env(start.projectId);

        await writeFile(reporter, SUITE_REPORTER.source);

        for (const [index, batch] of start.batches.entries()) {
          if (job.isStopping) break;

          await this.walk({
            job,
            batch,
            grep: null,
            ...tools,
            reporter,
            env,
            folder,
            output: join(folder, SUITE_RUNNER.output, String(index + 1)),
          });
        }
      }
    } finally {
      job.run.status = suiteStatusOf({
        results: job.run.results,
        isStopped: job.isStopping,
        isBroken: job.isBroken,
      });
      job.run.endedAt = this.now();
      this.jobs.delete(start.projectId);
      await this.save(job.run);
      this.onEvent({ kind: 'ended', run: { ...job.run } });
    }

    return { ...job.run };
  }

  /**
   * Como um teste foi na run de um projeto, com a pasta em que a run guarda os arquivos
   * dela; null quando a run ou o teste não está lá.
   */
  public async resultOf(props: {
    projectId: string;
    runId: string;
    testId: string;
  }): Promise<{ result: ISuiteResult; folder: string } | null> {
    const folder = join(this.root, props.projectId, SUITE_RUNNER.runs, props.runId);

    if (!isInside({ root: this.root, file: folder })) return null;

    const run = this.parse(
      await readFile(join(folder, SUITE_RUNNER.runFile), 'utf8').catch(() => ''),
    );
    const result = run?.results.find(({ testId }) => testId === props.testId);

    return result === undefined ? null : { result, folder };
  }

  /**
   * Roda alguns testes de uma suíte a partir de outra cópia dela, com as configurações do
   * projeto, fora das runs dele.
   */
  public async check(props: {
    projectId: string;
    path: string;
    project: string;
    filters: string[];
    grep: string | null;
    folder: string;
  }): Promise<ISuiteCheck> {
    const runner = await this.registry.runnerOf(props.path);
    const node = await this.node();

    if (runner === null || node === null)
      return {
        results: [],
        failure: runner === null ? 'no-runner' : 'no-node',
        said: '',
      };

    const job: ISuiteJob = {
      run: {
        id: SUITE_RUNNER.checkId,
        projectId: props.projectId,
        startedAt: this.now(),
        endedAt: null,
        status: 'running',
        total: 0,
        results: [],
        failure: null,
        said: '',
      },
      values: await this.values(props.projectId),
      expected: 0,
      counted: 0,
      child: null,
      isStopping: false,
      isBroken: false,
      isQuiet: true,
    };
    const reporter = join(this.root, SUITE_REPORTER.file);

    this.checks.set(props.folder, job);

    try {
      await mkdir(props.folder, { recursive: true });
      await writeFile(reporter, SUITE_REPORTER.source);
      await this.walk({
        job,
        batch: { project: props.project, filters: props.filters },
        grep: props.grep,
        path: props.path,
        cli: runner.cli,
        node,
        reporter,
        env: await this.env(props.projectId),
        folder: props.folder,
        output: join(props.folder, SUITE_RUNNER.output),
      });
    } finally {
      this.checks.delete(props.folder);
    }

    return { results: job.run.results, failure: job.run.failure, said: job.run.said };
  }

  /** Para uma checagem em andamento numa pasta, quando o agente que a pediu é parado. */
  public stopCheck(folder: string): void {
    const job = this.checks.get(folder);

    if (job === undefined) return;

    job.isStopping = true;

    if (job.child !== null) killTree(job.child, 'SIGTERM');
  }

  /**
   * Para a run que um projeto tem em andamento: o Playwright é mandado parar, e forçado
   * depois de uma carência.
   */
  public stop(projectId: string): void {
    const job = this.jobs.get(projectId);

    if (job === undefined) return;

    job.isStopping = true;

    const child = job.child;

    if (child === null) return;

    killTree(child, 'SIGINT');
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null)
        killTree(child, 'SIGTERM');
    }, SUITE_RUNNER.stopGraceMs);
  }

  /**
   * As runs de um projeto, as mais recentes primeiro, os arquivos de cada teste com o
   * endereço; uma run deixada rodando quando o QAzinho fechou aparece quebrada.
   */
  public async runs(projectId: string): Promise<ISuiteRun[]> {
    const folder = join(this.root, projectId, SUITE_RUNNER.runs);
    const ids = await readdir(folder).catch(() => []);
    const going = this.jobs.get(projectId);
    const read = await Promise.all(
      ids.map(async (id) =>
        this.parse(
          await readFile(join(folder, id, SUITE_RUNNER.runFile), 'utf8').catch(() => ''),
        ),
      ),
    );

    return read
      .flatMap((run) => (run === null ? [] : [run]))
      .map((run) =>
        run.id === going?.run.id
          ? { ...going.run }
          : run.status === 'running'
            ? { ...run, status: 'broke' as const }
            : run,
      )
      .map((run) => ({
        ...run,
        results: run.results.map((result) => this.addressed({ run, result })),
      }))
      .sort((one, other) => other.startedAt - one.startedAt);
  }

  /**
   * Abre um trace que um teste deixou no visualizador de trace próprio do Playwright, a
   * partir da pasta da suíte.
   */
  public async openTrace(props: {
    projectId: string;
    runId: string;
    file: string;
  }): Promise<boolean> {
    const tools = await this.toolsOf(props.projectId);
    const trace = join(
      this.root,
      props.projectId,
      SUITE_RUNNER.runs,
      props.runId,
      props.file,
    );

    if (tools.failure !== null || relative(this.root, trace).startsWith('..'))
      return false;

    const child = spawnCommand({
      command: tools.node,
      args: [tools.cli, 'show-trace', trace],
      options: {
        cwd: tools.path,
        env: { ...process.env, ...(await this.env(props.projectId)) },
        detached: true,
        stdio: 'ignore',
      },
    });

    child.unref();

    return true;
  }

  private async toolsOf(
    projectId: string,
  ): Promise<
    { failure: SuiteFailure } | { failure: null; path: string; cli: string; node: string }
  > {
    const path = await this.registry.pathOf(projectId);

    if (path === null) return { failure: 'no-suite' };

    const runner = await this.registry.runnerOf(path);

    if (runner === null) return { failure: 'no-runner' };

    const node = await this.node();

    return node === null
      ? { failure: 'no-node' }
      : { failure: null, path, cli: runner.cli, node };
  }

  private walk(props: {
    job: ISuiteJob;
    batch: ISuiteBatch;
    grep: string | null;
    path: string;
    cli: string;
    node: string;
    reporter: string;
    env: Record<string, string>;
    folder: string;
    output: string;
  }): Promise<void> {
    const { job, batch, path, folder } = props;

    return new Promise((done) => {
      const child = spawnCommand({
        command: props.node,
        args: [
          props.cli,
          'test',
          ...(batch.project === '' ? [] : [`--project=${batch.project}`]),
          `--reporter=${props.reporter}`,
          `--output=${props.output}`,
          '--trace=retain-on-failure',
          ...(props.grep === null ? [] : [`--grep=${props.grep}`]),
          ...batch.filters.map(locationOf),
        ],
        options: {
          cwd: path,
          env: { ...process.env, ...SUITE_RUNNER.env, ...props.env },
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: process.platform !== 'win32',
        },
      });
      let said = '';
      let hasEnded = false;
      const keep = (text: string) => {
        said = `${said}${text}`.slice(-SUITE_RUNNER.saidChars * 4);
      };

      job.child = child;
      createInterface({ input: child.stdout }).on('line', (line) => {
        const report = suiteReportOf(line);

        if (report === null) keep(`${line}\n`);
        else if (report.kind === 'end') hasEnded = true;
        else this.hear({ job, report, path, folder });
      });
      child.stderr.on('data', (chunk: Buffer) => {
        keep(chunk.toString());
      });
      child.on('error', (error) => {
        keep(error.message);
      });
      child.on('close', () => {
        job.child = null;

        if (!hasEnded && !job.isStopping) {
          job.isBroken = true;
          job.run.failure = job.run.failure ?? 'unreadable';
          job.run.said = hiddenValues({
            text: `${job.run.said}${stripAnsi(said).trim()}`,
            values: job.values,
          }).slice(-SUITE_RUNNER.saidChars);
        }

        done();
      });
    });
  }

  private hear(props: {
    job: ISuiteJob;
    report: SuiteReport;
    path: string;
    folder: string;
  }): void {
    const { job, report } = props;
    const { projectId, id: runId } = job.run;

    const tell = (event: SuiteEvent) => {
      if (!job.isQuiet) this.onEvent(event);
    };

    if (report.kind === 'begin') {
      job.counted += report.total;
      job.run.total = Math.max(job.expected, job.counted);
      tell({ kind: 'total', projectId, runId, total: job.run.total });
    } else if (report.kind === 'test-begin') {
      tell({ kind: 'testStarted', projectId, runId, testId: report.id });
    } else if (report.kind === 'step') {
      tell({
        kind: 'step',
        projectId,
        runId,
        testId: report.id,
        title: report.title,
      });
    } else if (report.kind === 'error') {
      job.run.said = hiddenValues({
        text: `${job.run.said}${report.message}\n`,
        values: job.values,
      }).slice(-SUITE_RUNNER.saidChars);
    } else if (report.kind === 'test-end') {
      const found: ISuiteResult = {
        testId: report.id,
        title: report.title,
        file: relative(props.path, report.file),
        line: report.line,
        project: report.project,
        status: report.status,
        isFlaky: report.outcome === 'flaky',
        durationMs: report.durationMs,
        error:
          report.error === null
            ? null
            : hiddenValues({ text: report.error, values: job.values }),
        attachments: report.attachments.flatMap((attachment) => {
          const file = relative(props.folder, attachment.path);

          return file.startsWith('..') || isAbsolute(file)
            ? []
            : [
                {
                  name: attachment.name,
                  contentType: attachment.contentType,
                  file,
                  url: null,
                },
              ];
        }),
      };
      const result = job.isQuiet
        ? found
        : this.addressed({ run: job.run, result: found });

      job.run.results = [
        ...job.run.results.filter(({ testId }) => testId !== result.testId),
        result,
      ];
      tell({ kind: 'testEnded', projectId, runId, result });
    }
  }

  private addressed(props: { run: ISuiteRun; result: ISuiteResult }): ISuiteResult {
    const { run, result } = props;

    return {
      ...result,
      attachments: result.attachments.map((attachment) => ({
        ...attachment,
        url: this.urlOf({
          projectId: run.projectId,
          runId: run.id,
          file: attachment.file,
        }),
      })),
    };
  }

  private folderOf(run: ISuiteRun): string {
    return join(this.root, run.projectId, SUITE_RUNNER.runs, run.id);
  }

  private async save(run: ISuiteRun): Promise<void> {
    const kept: ISuiteRun = {
      ...run,
      results: run.results.map((result) => ({
        ...result,
        attachments: result.attachments.map((attachment) => ({
          ...attachment,
          url: null,
        })),
      })),
    };

    await mkdir(this.folderOf(run), { recursive: true });
    await writeFile(join(this.folderOf(run), SUITE_RUNNER.runFile), JSON.stringify(kept));
  }

  private parse(text: string): ISuiteRun | null {
    try {
      const read = JSON.parse(text) as ISuiteRun;

      return typeof read.id === 'string' && Array.isArray(read.results) ? read : null;
    } catch {
      return null;
    }
  }

  private exec(props: {
    command: string;
    args: string[];
    cwd: string;
    env: Record<string, string>;
  }): Promise<string> {
    return new Promise((done) => {
      const child = spawnCommand({
        command: props.command,
        args: props.args,
        options: {
          cwd: props.cwd,
          env: { ...process.env, ...SUITE_RUNNER.env, ...props.env },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      });
      let said = '';
      const hear = (chunk: Buffer) => {
        said = `${said}${chunk.toString()}`.slice(-SUITE_RUNNER.saidChars * 4);
      };
      const timer = setTimeout(() => {
        child.kill();
      }, SUITE_RUNNER.listTimeoutMs);
      const finish = () => {
        clearTimeout(timer);
        done(stripAnsi(said).trim().slice(-SUITE_RUNNER.saidChars));
      };

      child.stdout.on('data', hear);
      child.stderr.on('data', hear);
      child.on('error', (error) => {
        said = error.message;
        finish();
      });
      child.on('close', finish);
    });
  }
}
