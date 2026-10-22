import type { ISuiteRunner } from './types';
import type { SuiteRegistry } from '@/main/classes/automation/SuiteRegistry';
import type { SuiteList } from '@/shared/types';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { stripAnsi } from '@/main/library';
import { SUITE_RUNNER } from './constants';
import { suiteTestsOf } from './library';

/** Runs the QA's Playwright suites with their own Playwright and their own settings: lists their tests, and runs them. */
export class SuiteRunner {
  private readonly registry: Pick<SuiteRegistry, 'pathOf' | 'runnerOf'>;
  private readonly node: () => Promise<string | null>;
  private readonly env: (projectId: string) => Promise<Record<string, string>>;
  private readonly root: string;

  public constructor(props: ISuiteRunner) {
    this.registry = props.registry;
    this.node = props.node;
    this.env = props.env;
    this.root = props.root;
  }

  /** The tests a project's suite holds, as its own Playwright lists them, or why it could not. */
  public async list(projectId: string): Promise<SuiteList> {
    const path = await this.registry.pathOf(projectId);

    if (path === null) return { kind: 'failed', reason: 'no-suite', said: '' };

    const runner = await this.registry.runnerOf(path);

    if (runner === null) return { kind: 'failed', reason: 'no-runner', said: '' };

    const node = await this.node();

    if (node === null) return { kind: 'failed', reason: 'no-node', said: '' };

    const folder = join(this.root, projectId);
    const file = join(folder, SUITE_RUNNER.listFile);

    await mkdir(folder, { recursive: true });

    const said = await this.exec({
      command: node,
      args: [runner.cli, 'test', '--list', '--reporter=json'],
      cwd: path,
      env: { ...(await this.env(projectId)), PLAYWRIGHT_JSON_OUTPUT_FILE: file },
    });
    const listed = suiteTestsOf({
      text: await readFile(file, 'utf8').catch(() => ''),
      root: path,
    });

    await rm(file, { force: true });

    return listed === null
      ? { kind: 'failed', reason: 'unreadable', said }
      : { kind: 'listed', ...listed };
  }

  private exec(props: {
    command: string;
    args: string[];
    cwd: string;
    env: Record<string, string>;
  }): Promise<string> {
    return new Promise((done) => {
      const child = spawn(props.command, props.args, {
        cwd: props.cwd,
        env: { ...process.env, ...SUITE_RUNNER.env, ...props.env },
        stdio: ['ignore', 'pipe', 'pipe'],
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
