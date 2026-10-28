import type { IJiraApi, JiraAnswer, JiraFetcher, JiraFiled } from './types';
import type { IJiraCredentials } from '@/main/types';
import type {
  BugComment,
  IBugReport,
  IJiraIssueRef,
  IJiraStory,
  ITrackerIssue,
  JiraFailure,
  JiraIssueList,
  JiraProjectList,
} from '@/shared/types';
import { writeFile } from 'node:fs/promises';
import { JIRA_READ, JIRA_WRITE } from './constants';
import {
  adfOfReport,
  askAtlassian,
  bugTypeOf,
  jiraIssueOf,
  jiraProjectsOf,
  jiraStoryOf,
  pickedIssuesOf,
} from './library';

/**
 * Fala com o Jira Cloud do QA com as credenciais lacradas para ele: acha issues, lê uma
 * história com os arquivos dela, e registra um bug com os dele.
 */
export class JiraApi {
  private readonly credentials: () => Promise<IJiraCredentials | null>;
  private readonly fetcher: JiraFetcher;

  public constructor(props: IJiraApi) {
    this.credentials = props.credentials;
    this.fetcher = props.fetcher;
  }

  /**
   * As issues que o seletor oferece: a que uma chave digitada nomeia primeiro, depois as
   * que o QA viu por último ou que casam com o que digitou.
   */
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

  /** Uma issue lida inteira como história, ou por que o Jira não a entregou. */
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

  /**
   * Baixa um arquivo anexado a uma issue para um arquivo em disco; false quando o Jira
   * não o entregou ou ele passou de `maxBytes`.
   */
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

  /**
   * Os projetos em que o QA pode registrar: os que abriu por último primeiro, depois o
   * resto que o Jira lista.
   */
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

  /**
   * Registra um bug num projeto como uma issue do tipo Bug, ou o tipo mais próximo: a
   * issue nova, ou por que o Jira a recusou.
   */
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

  /**
   * Uma issue como o Jira a guarda agora, com o status e os últimos comentários do time,
   * ou por que o Jira não a entregou.
   */
  public async issue(
    key: string,
  ): Promise<
    | { isRead: true; issue: ITrackerIssue }
    | { isRead: false; failure: JiraFailure; said: string }
  > {
    const signed = await this.credentials();

    if (signed === null) return { isRead: false, failure: 'not-connected', said: '' };

    const answer = await this.request({
      signed,
      path: `/rest/api/3/issue/${encodeURIComponent(key)}?fields=summary,description,status,comment`,
    });

    if (!answer.isOk)
      return { isRead: false, failure: answer.failure, said: answer.said };

    const issue = jiraIssueOf({ issue: answer.body, site: signed.site });

    return issue === null
      ? { isRead: false, failure: 'unexpected', said: '' }
      : { isRead: true, issue };
  }

  /**
   * Soma um comentário sob uma issue, escrito a partir dos blocos de um relatório: onde
   * ele fica, ou por que o Jira o recusou.
   */
  public async comment(props: { key: string; report: IBugReport }): Promise<BugComment> {
    const signed = await this.credentials();

    if (signed === null) return { isPosted: false, failure: 'not-connected', said: '' };

    const answer = await this.request({
      signed,
      path: `/rest/api/3/issue/${encodeURIComponent(props.key)}/comment`,
      method: 'POST',
      json: { body: adfOfReport(props.report) },
    });

    if (!answer.isOk)
      return { isPosted: false, failure: answer.failure, said: answer.said };

    const id = (answer.body as { id?: unknown } | null)?.id;

    return {
      isPosted: true,
      url: `${signed.site}/browse/${props.key}${typeof id === 'string' ? `?focusedCommentId=${id}` : ''}`,
      missed: [],
    };
  }

  /** Anexa um arquivo a uma issue; false quando o Jira não o aceitou. */
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

  /**
   * Liga uma issue a outra como relacionada, como um bug à história de onde foi
   * planejado; false quando o Jira recusou.
   */
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

  private request(
    props: Omit<Parameters<typeof askAtlassian>[0], 'fetcher'>,
  ): Promise<JiraAnswer> {
    return askAtlassian({ ...props, fetcher: this.fetcher });
  }
}
