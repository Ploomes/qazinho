import type { IJiraApi, JiraAnswer, JiraFetcher, JiraFiled } from './types';
import type { IJiraCredentials } from '@/main/types';
import type {
  IBugReport,
  IJiraIssueRef,
  IJiraStory,
  JiraFailure,
  JiraIssueList,
  JiraProjectList,
} from '@/shared/types';
import { writeFile } from 'node:fs/promises';
import { JIRA_READ, JIRA_WRITE } from './constants';
import {
  adfOfReport,
  bugTypeOf,
  jiraFailureOf,
  jiraProjectsOf,
  jiraSaidOf,
  jiraStoryOf,
  pickedIssuesOf,
} from './library';

/** Talks to the QA's Jira Cloud with the credentials sealed for it: finds issues, reads a story with its files, and files a bug with its own. */
export class JiraApi {
  private readonly credentials: () => Promise<IJiraCredentials | null>;
  private readonly fetcher: JiraFetcher;

  public constructor(props: IJiraApi) {
    this.credentials = props.credentials;
    this.fetcher = props.fetcher;
  }

  /** The issues the picker offers: the one a typed key names first, then the ones the QA saw last or that match what they typed. */
  public async search(query: string): Promise<JiraIssueList> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const typed = query.trim();
    const params = new URLSearchParams({ query: typed, showSubTasks: 'true' });
    const [named, picked] = await Promise.all([
      JIRA_READ.issueKey.test(typed)
        ? this.request({
            signed,
            path: `/rest/api/3/issue/${encodeURIComponent(typed.toUpperCase())}?fields=summary`,
          })
        : Promise.resolve(null),
      this.request({ signed, path: `/rest/api/3/issue/picker?${params.toString()}` }),
    ]);

    if (!picked.isOk && (named === null || !named.isOk))
      return { isListed: false, failure: picked.failure };

    const first: IJiraIssueRef[] =
      named?.isOk === true ? this.refsOf({ body: named.body, site: signed.site }) : [];
    const rest = picked.isOk
      ? pickedIssuesOf({ answer: picked.body, site: signed.site })
      : [];

    return {
      isListed: true,
      issues: [
        ...first,
        ...rest.filter(({ key }) => first.every((one) => one.key !== key)),
      ].slice(0, JIRA_READ.pickerSize),
    };
  }

  /** One issue read whole as a story, or why Jira did not hand it over. */
  public async story(
    key: string,
  ): Promise<
    { isRead: true; story: IJiraStory } | { isRead: false; failure: JiraFailure }
  > {
    const signed = await this.credentials();

    if (signed === null) return { isRead: false, failure: 'not-connected' };

    const answer = await this.request({
      signed,
      path: `/rest/api/3/issue/${encodeURIComponent(key)}?fields=*all&expand=names`,
    });

    if (!answer.isOk) return { isRead: false, failure: answer.failure };

    const story = jiraStoryOf({ issue: answer.body, site: signed.site });

    return story === null
      ? { isRead: false, failure: 'unexpected' }
      : { isRead: true, story };
  }

  /** Downloads one file attached to an issue into a file on disk; false when Jira did not hand it over or it grew past `maxBytes`. */
  public async download(props: {
    id: string;
    file: string;
    maxBytes: number;
  }): Promise<boolean> {
    const signed = await this.credentials();

    if (signed === null) return false;

    const answer = await this.request({
      signed,
      path: `/rest/api/3/attachment/content/${encodeURIComponent(props.id)}`,
      isBinary: true,
    });

    if (!answer.isOk || answer.bytes === null || answer.bytes.byteLength > props.maxBytes)
      return false;

    return writeFile(props.file, new Uint8Array(answer.bytes)).then(
      () => true,
      () => false,
    );
  }

  /** The projects the QA can file in: the ones they opened last first, then the rest Jira lists. */
  public async projects(): Promise<JiraProjectList> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const answers = await Promise.all([
      this.request({ signed, path: '/rest/api/3/project/recent' }),
      this.request({
        signed,
        path: `/rest/api/3/project/search?maxResults=${String(JIRA_WRITE.projects)}`,
      }),
    ]);
    const [recent, all] = answers;

    if (!recent.isOk && !all.isOk) return { isListed: false, failure: all.failure };

    const seen = new Set<string>();

    return {
      isListed: true,
      projects: answers
        .flatMap((answer) => (answer.isOk ? jiraProjectsOf(answer.body) : []))
        .filter(({ key }) => {
          if (seen.has(key)) return false;

          seen.add(key);

          return true;
        }),
    };
  }

  /** Files a bug in a project as an issue of its Bug type, or the type closest to it: the new issue, or why Jira refused it. */
  public async fileBug(props: {
    project: string;
    report: IBugReport;
  }): Promise<JiraFiled> {
    const signed = await this.credentials();

    if (signed === null) return { isFiled: false, failure: 'not-connected', said: '' };

    const types = await this.request({
      signed,
      path: `/rest/api/3/issue/createmeta/${encodeURIComponent(props.project)}/issuetypes`,
    });

    if (!types.isOk && types.failure !== 'unexpected')
      return { isFiled: false, failure: types.failure, said: types.said };

    const typeId = types.isOk ? bugTypeOf(types.body) : null;
    const created = await this.request({
      signed,
      path: '/rest/api/3/issue',
      method: 'POST',
      json: {
        fields: {
          project: { key: props.project },
          issuetype: typeId === null ? { name: JIRA_WRITE.bugType } : { id: typeId },
          summary: props.report.title
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, JIRA_WRITE.summaryLength),
          description: adfOfReport(props.report),
        },
      },
    });

    if (!created.isOk)
      return { isFiled: false, failure: created.failure, said: created.said };

    const key = (created.body as { key?: unknown } | null)?.key;

    return typeof key === 'string'
      ? { isFiled: true, key, url: `${signed.site}/browse/${key}` }
      : { isFiled: false, failure: 'unexpected', said: '' };
  }

  /** Attaches one file to an issue; false when Jira did not take it. */
  public async attach(props: {
    key: string;
    name: string;
    type: string;
    bytes: Uint8Array;
  }): Promise<boolean> {
    const signed = await this.credentials();

    if (signed === null) return false;

    const form = new FormData();

    form.append(
      'file',
      new Blob([new Uint8Array(props.bytes)], { type: props.type }),
      props.name,
    );

    return (
      await this.request({
        signed,
        path: `/rest/api/3/issue/${encodeURIComponent(props.key)}/attachments`,
        method: 'POST',
        form,
        timeoutMs: JIRA_WRITE.uploadTimeoutMs,
      })
    ).isOk;
  }

  /** Links an issue to another as related, such as a bug to the story it was planned from; false when Jira refused it. */
  public async relate(props: { key: string; to: string }): Promise<boolean> {
    const signed = await this.credentials();

    if (signed === null) return false;

    return (
      await this.request({
        signed,
        path: '/rest/api/3/issueLink',
        method: 'POST',
        json: {
          type: { name: JIRA_WRITE.linkType },
          inwardIssue: { key: props.key },
          outwardIssue: { key: props.to },
        },
        isEmpty: true,
      })
    ).isOk;
  }

  private refsOf(props: { body: unknown; site: string }): IJiraIssueRef[] {
    const { key, fields } = (props.body ?? {}) as {
      key?: unknown;
      fields?: { summary?: unknown };
    };

    return typeof key === 'string'
      ? [
          {
            key,
            summary: typeof fields?.summary === 'string' ? fields.summary : '',
            url: `${props.site}/browse/${key}`,
          },
        ]
      : [];
  }

  private async request(props: {
    signed: IJiraCredentials;
    path: string;
    method?: 'POST';
    json?: unknown;
    form?: FormData;
    isBinary?: boolean;
    isEmpty?: boolean;
    timeoutMs?: number;
  }): Promise<JiraAnswer> {
    const { signed, json, form } = props;
    const basic = Buffer.from(`${signed.email}:${signed.token}`).toString('base64');
    const answer = await this.fetcher(`${signed.site}${props.path}`, {
      method: props.method ?? 'GET',
      headers: {
        Accept: props.isBinary === true ? '*/*' : 'application/json',
        Authorization: `Basic ${basic}`,
        ...(json === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(form === undefined ? {} : { 'X-Atlassian-Token': 'no-check' }),
      },
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
      ...(form === undefined ? {} : { body: form }),
      signal: AbortSignal.timeout(
        props.timeoutMs ??
          (props.isBinary === true ? JIRA_READ.downloadTimeoutMs : JIRA_READ.timeoutMs),
      ),
    }).catch(() => null);

    if (answer === null) return { isOk: false, failure: 'unreachable', said: '' };

    if (!answer.ok)
      return {
        isOk: false,
        failure: jiraFailureOf(answer),
        said: jiraSaidOf(await answer.json().catch(() => null)),
      };

    if (props.isEmpty === true) return { isOk: true, body: null, bytes: null };

    if (props.isBinary === true)
      return answer.arrayBuffer().then(
        (bytes): JiraAnswer => ({ isOk: true, body: null, bytes }),
        (): JiraAnswer => ({ isOk: false, failure: 'unreachable', said: '' }),
      );

    return answer.json().then(
      (body): JiraAnswer => ({ isOk: true, body, bytes: null }),
      (): JiraAnswer => ({ isOk: false, failure: 'unexpected', said: '' }),
    );
  }
}
