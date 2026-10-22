import type { IJiraApi, JiraAnswer, JiraFetcher } from './types';
import type { IJiraCredentials } from '@/main/types';
import type {
  IJiraIssueRef,
  IJiraStory,
  JiraFailure,
  JiraIssueList,
} from '@/shared/types';
import { writeFile } from 'node:fs/promises';
import { JIRA_READ } from './constants';
import { jiraFailureOf, jiraStoryOf, pickedIssuesOf } from './library';

/** Talks to the QA's Jira Cloud with the credentials sealed for it: finds issues, and reads a story with its files. */
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
    isBinary?: boolean;
  }): Promise<JiraAnswer> {
    const { signed } = props;
    const basic = Buffer.from(`${signed.email}:${signed.token}`).toString('base64');
    const answer = await this.fetcher(`${signed.site}${props.path}`, {
      method: 'GET',
      headers: {
        Accept: props.isBinary === true ? '*/*' : 'application/json',
        Authorization: `Basic ${basic}`,
      },
      signal: AbortSignal.timeout(
        props.isBinary === true ? JIRA_READ.downloadTimeoutMs : JIRA_READ.timeoutMs,
      ),
    }).catch(() => null);

    if (answer === null || !answer.ok)
      return { isOk: false, failure: jiraFailureOf(answer) };

    if (props.isBinary === true)
      return answer.arrayBuffer().then(
        (bytes): JiraAnswer => ({ isOk: true, body: null, bytes }),
        (): JiraAnswer => ({ isOk: false, failure: 'unreachable' }),
      );

    return answer.json().then(
      (body): JiraAnswer => ({ isOk: true, body, bytes: null }),
      (): JiraAnswer => ({ isOk: false, failure: 'unexpected' }),
    );
  }
}
