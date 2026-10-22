import type { IBugFiler, IEvidenceFile, IGithubFiling, IJiraFiling } from './types';
import type {
  BugFiling,
  BugVideo,
  FilingStep,
  IEvidenceShot,
  IFileBug,
  IFilingEvent,
  IRunRef,
} from '@/shared/types';
import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { fileNameOf, imageExtensionOf } from '@/main/library';
import { BUG_FILING } from './constants';
import { filingFailureOf, githubIssueOf, markdownOfReport } from './library';

/** Files the QA's bug in their tracker: a Jira issue with its screens and video attached and linked to its story, or a GitHub issue through the QA's gh. */
export class BugFiler {
  private readonly jira: IJiraFiling;
  private readonly github: IGithubFiling;
  private readonly readShot: (shot: IEvidenceShot) => Promise<Buffer | null>;
  private readonly recordingOf: (run: IRunRef) => Promise<string | null>;
  private readonly onEvent: (event: IFilingEvent) => void;
  private readonly now: () => Date;

  public constructor(props: IBugFiler) {
    this.jira = props.jira;
    this.github = props.github;
    this.readShot = props.readShot;
    this.recordingOf = props.recordingOf;
    this.onEvent = props.onEvent;
    this.now = props.now;
  }

  /** Sends one bug, telling each step as it goes: the issue it became, or why there is none. */
  public async file(request: IFileBug): Promise<BugFiling> {
    const { target } = request;

    return target.tracker === 'jira'
      ? this.toJira({ request, project: target.project })
      : this.toGithub({ request, repository: `${target.owner}/${target.name}` });
  }

  private async toJira(props: {
    request: IFileBug;
    project: string;
  }): Promise<BugFiling> {
    const { request } = props;
    const tell = (step: FilingStep, state: IFilingEvent['state']) => {
      this.onEvent({ filingId: request.filingId, step, state });
    };

    tell('issue', 'working');

    const filed = await this.jira.fileBug({
      project: props.project,
      report: request.report,
    });

    if (!filed.isFiled) {
      tell('issue', 'failed');

      return { isFiled: false, failure: filed.failure, said: filed.said };
    }

    tell('issue', 'done');

    const missed: string[] = [];

    if (request.shots.length > 0) {
      tell('screens', 'working');

      for (const shot of request.shots) {
        const file = await this.shotFileOf(shot);

        if (file === null || !(await this.jira.attach({ key: filed.key, ...file })))
          missed.push(file?.name ?? shot.name);
      }

      tell('screens', missed.length === request.shots.length ? 'failed' : 'done');
    }

    if (request.video !== null) {
      tell('video', 'working');

      const file = await this.videoFileOf(request.video);
      const isAttached =
        file !== null && (await this.jira.attach({ key: filed.key, ...file }));

      if (!isAttached) missed.push(file?.name ?? request.video.name);

      tell('video', isAttached ? 'done' : 'failed');
    }

    let linked: string | null = null;

    if (request.story !== null) {
      tell('link', 'working');

      if (await this.jira.relate({ key: filed.key, to: request.story }))
        linked = request.story;

      tell('link', linked === null ? 'failed' : 'done');
    }

    return {
      isFiled: true,
      issue: {
        tracker: 'jira',
        key: filed.key,
        url: filed.url,
        at: this.now().toISOString(),
      },
      missed,
      linked,
    };
  }

  private async toGithub(props: {
    request: IFileBug;
    repository: string;
  }): Promise<BugFiling> {
    const { request, repository } = props;
    const tell = (state: IFilingEvent['state']) => {
      this.onEvent({ filingId: request.filingId, step: 'issue', state });
    };

    tell('working');

    const label = await this.github.api({
      path: `repos/${repository}/labels/${BUG_FILING.label}`,
    });
    const created = await this.github.api({
      path: `repos/${repository}/issues`,
      method: 'POST',
      fields: {
        title: request.report.title.trim(),
        body: markdownOfReport(request.report),
        ...(label.isOk ? { 'labels[]': BUG_FILING.label } : {}),
      },
    });

    if (!created.isOk) {
      tell('failed');

      return {
        isFiled: false,
        failure: filingFailureOf(created),
        said: created.said,
      };
    }

    const issue = githubIssueOf(created.text);

    tell(issue === null ? 'failed' : 'done');

    return issue === null
      ? { isFiled: false, failure: 'unexpected', said: '' }
      : {
          isFiled: true,
          issue: {
            tracker: 'github',
            key: `#${String(issue.number)}`,
            url: issue.url,
            at: this.now().toISOString(),
          },
          missed: [],
          linked: null,
        };
  }

  private async shotFileOf(shot: IEvidenceShot): Promise<IEvidenceFile | null> {
    const bytes = await this.readShot(shot);

    if (bytes === null) return null;

    const extension = imageExtensionOf(bytes);

    return {
      name: `${fileNameOf(shot.name)}.${extension}`,
      type: BUG_FILING.types[extension],
      bytes,
    };
  }

  private async videoFileOf(video: BugVideo): Promise<IEvidenceFile | null> {
    if (video.kind === 'clip')
      return {
        name: `${fileNameOf(video.name)}.mp4`,
        type: BUG_FILING.types.mp4,
        bytes: video.data,
      };

    const file = await this.recordingOf(video.run);
    const size =
      file === null
        ? null
        : await stat(file).then(
            (found) => found.size,
            () => null,
          );

    if (file === null || size === null || size > BUG_FILING.recordingMaxBytes)
      return null;

    const extension = extname(file).slice(1) === 'webm' ? 'webm' : 'mp4';
    const bytes = await readFile(file).catch(() => null);

    return bytes === null
      ? null
      : {
          name: `${fileNameOf(video.name)}.${extension}`,
          type: BUG_FILING.types[extension],
          bytes,
        };
  }
}
