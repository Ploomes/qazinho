import type { IJiraApi, JiraAnswer, JiraFetcher, JiraFiled } from './types';
import type { IJiraCredentials } from '@/main/types';
import type {
  BoardColumnList,
  BugComment,
  IBugReport,
  IJiraIssueRef,
  IJiraStory,
  IStoryAnswersAsk,
  IStoryDoubtsPost,
  ITellStory,
  ITrackerIssue,
  JiraBoardList,
  JiraFailure,
  JiraIssueList,
  JiraProjectList,
  SprintStories,
  StoryAnswers,
  StoryDoubtsPosted,
  StoryPeople,
  StoryStatus,
} from '@/shared/types';
import { writeFile } from 'node:fs/promises';
import { JIRA_READ, JIRA_WRITE } from './constants';
import {
  activeSprintOf,
  adfOfDoubts,
  adfOfNote,
  adfOfReport,
  askAtlassian,
  boardColumnsOf,
  bugTypeOf,
  commentsSinceOf,
  jiraBoardsOf,
  jiraIssueOf,
  jiraProjectsOf,
  jiraStoryOf,
  pickedIssuesOf,
  sprintStoriesOf,
  storyAnswersOf,
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

  /** Os boards do Jira do QA, os que casam com o nome digitado. */
  public async boards(query: string): Promise<JiraBoardList> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const params = new URLSearchParams({ maxResults: String(JIRA_READ.boards) });

    if (query.trim() !== '') params.set('name', query.trim());

    const answer = await this.request({
      signed,
      path: `/rest/agile/1.0/board?${params.toString()}`,
    });

    return answer.isOk
      ? { isListed: true, boards: jiraBoardsOf(answer.body) }
      : { isListed: false, failure: answer.failure };
  }

  /** As colunas de um board, cada uma com os status que caem nela. */
  public async columns(boardId: number): Promise<BoardColumnList> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const [config, statuses] = await Promise.all([
      this.request({
        signed,
        path: `/rest/agile/1.0/board/${String(boardId)}/configuration`,
      }),
      this.request({ signed, path: '/rest/api/3/status' }),
    ]);

    if (!config.isOk) return { isListed: false, failure: config.failure };

    if (!statuses.isOk) return { isListed: false, failure: statuses.failure };

    return {
      isListed: true,
      columns: boardColumnsOf({ config: config.body, statuses: statuses.body }),
    };
  }

  /** As histórias da sprint aberta de um board, sem subtarefas nem épicos. */
  public async sprintStories(boardId: number): Promise<SprintStories> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const sprints = await this.request({
      signed,
      path: `/rest/agile/1.0/board/${String(boardId)}/sprint?state=active`,
    });

    if (!sprints.isOk) return { isListed: false, failure: sprints.failure };

    const sprint = activeSprintOf(sprints.body);

    if (sprint === null) return { isListed: true, sprint: null, stories: [] };

    const params = new URLSearchParams({
      fields: 'summary,status,issuetype',
      maxResults: String(JIRA_READ.sprintStories),
    });
    const issues = await this.request({
      signed,
      path: `/rest/agile/1.0/sprint/${String(sprint.id)}/issue?${params.toString()}`,
    });

    return issues.isOk
      ? {
          isListed: true,
          sprint: sprint.name,
          stories: sprintStoriesOf({ body: issues.body, site: signed.site }),
        }
      : { isListed: false, failure: issues.failure };
  }

  /** Em que status uma história está agora. */
  public async status(key: string): Promise<StoryStatus> {
    const signed = await this.credentials();

    if (signed === null) return { isRead: false, failure: 'not-connected' };

    const answer = await this.request({
      signed,
      path: `/rest/api/3/issue/${encodeURIComponent(key)}?fields=status`,
    });

    if (!answer.isOk) return { isRead: false, failure: answer.failure };

    const status = (this.fieldsOf(answer.body).status as { name?: unknown } | undefined)
      ?.name;

    return typeof status === 'string'
      ? { isRead: true, status }
      : { isRead: false, failure: 'unexpected' };
  }

  /** O que outros escreveram numa história depois de um momento, do mais velho. */
  public async commentsSince(props: {
    key: string;
    since: string;
  }): Promise<{ author: string; at: string; text: string }[] | null> {
    const signed = await this.credentials();

    if (signed === null) return null;

    const [comments, me] = await Promise.all([
      this.request({
        signed,
        path: `/rest/api/3/issue/${encodeURIComponent(props.key)}/comment?orderBy=-created&maxResults=${String(JIRA_READ.answerComments)}`,
      }),
      this.request({ signed, path: '/rest/api/3/myself' }),
    ]);

    return comments.isOk
      ? commentsSinceOf({
          body: comments.body,
          since: props.since,
          me: (me.isOk ? this.personOf(me.body)?.id : null) ?? '',
        })
      : null;
  }

  /** Quem escreveu uma história e se o QA já a acompanha. */
  public async people(key: string): Promise<StoryPeople> {
    const signed = await this.credentials();

    if (signed === null) return { isRead: false, failure: 'not-connected' };

    const answer = await this.request({
      signed,
      path: `/rest/api/3/issue/${encodeURIComponent(key)}?fields=reporter,watches`,
    });

    if (!answer.isOk) return { isRead: false, failure: answer.failure };

    const fields = this.fieldsOf(answer.body);
    const reporter = this.personOf(fields.reporter);

    return {
      isRead: true,
      reporter: reporter?.name ?? null,
      isWatching:
        (fields.watches as { isWatching?: unknown } | undefined)?.isWatching === true,
    };
  }

  /**
   * Posta as dúvidas do QA sob uma história, mencionando quem a escreveu, e o põe para
   * acompanhá-la quando ele pediu: onde o comentário fica, ou por que não.
   */
  public async askStory(post: IStoryDoubtsPost): Promise<StoryDoubtsPosted> {
    const signed = await this.credentials();

    if (signed === null) return { isPosted: false, failure: 'not-connected', said: '' };

    const path = `/rest/api/3/issue/${encodeURIComponent(post.key)}`;
    const [story, me] = await Promise.all([
      this.request({ signed, path: `${path}?fields=reporter` }),
      this.request({ signed, path: '/rest/api/3/myself' }),
    ]);
    const reporter = story.isOk
      ? this.personOf(this.fieldsOf(story.body).reporter)
      : null;
    const myself = me.isOk ? this.personOf(me.body) : null;
    const mention = reporter !== null && reporter.id !== myself?.id ? reporter : null;
    const posted = await this.request({
      signed,
      path: `${path}/comment`,
      method: 'POST',
      json: { body: adfOfDoubts({ ...post, mention }) },
    });

    if (!posted.isOk)
      return { isPosted: false, failure: posted.failure, said: posted.said };

    if (post.isWatching && myself !== null)
      await this.request({
        signed,
        path: `${path}/watchers`,
        method: 'POST',
        json: myself.id,
        isEmpty: true,
      });

    const { id, created } = (posted.body ?? {}) as { id?: unknown; created?: unknown };

    return {
      isPosted: true,
      url: `${signed.site}/browse/${post.key}${typeof id === 'string' ? `?focusedCommentId=${id}` : ''}`,
      at:
        typeof created === 'string'
          ? new Date(created).toISOString()
          : new Date().toISOString(),
      mentioned: mention?.name ?? null,
    };
  }

  /** O que o time respondeu às dúvidas mandadas a uma história, nos comentários. */
  public async answers(ask: IStoryAnswersAsk): Promise<StoryAnswers> {
    const signed = await this.credentials();

    if (signed === null) return { isRead: false, failure: 'not-connected' };

    const [comments, me] = await Promise.all([
      this.request({
        signed,
        path: `/rest/api/3/issue/${encodeURIComponent(ask.key)}/comment?orderBy=-created&maxResults=${String(JIRA_READ.answerComments)}`,
      }),
      this.request({ signed, path: '/rest/api/3/myself' }),
    ]);

    if (!comments.isOk) return { isRead: false, failure: comments.failure };

    return {
      isRead: true,
      answers: storyAnswersOf({
        comments: comments.body,
        doubts: ask.doubts,
        me: (me.isOk ? this.personOf(me.body)?.id : null) ?? '',
      }),
    };
  }

  /** Posta sob uma história o comentário que o QA escreveu, ou diz por que não. */
  public async tell(told: ITellStory): Promise<BugComment> {
    const signed = await this.credentials();

    if (signed === null) return { isPosted: false, failure: 'not-connected', said: '' };

    const answer = await this.request({
      signed,
      path: `/rest/api/3/issue/${encodeURIComponent(told.key)}/comment`,
      method: 'POST',
      json: { body: adfOfNote(told.text) },
    });

    if (!answer.isOk)
      return { isPosted: false, failure: answer.failure, said: answer.said };

    const id = (answer.body as { id?: unknown } | null)?.id;

    return {
      isPosted: true,
      url: `${signed.site}/browse/${told.key}${typeof id === 'string' ? `?focusedCommentId=${id}` : ''}`,
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

  private fieldsOf(body: unknown): Record<string, unknown> {
    const { fields } = (body ?? {}) as { fields?: unknown };

    return typeof fields === 'object' && fields !== null
      ? (fields as Record<string, unknown>)
      : {};
  }

  private personOf(value: unknown): { id: string; name: string } | null {
    const { accountId, displayName } = (value ?? {}) as {
      accountId?: unknown;
      displayName?: unknown;
    };

    return typeof accountId === 'string' && accountId !== ''
      ? { id: accountId, name: typeof displayName === 'string' ? displayName : '' }
      : null;
  }

  private request(
    props: Omit<Parameters<typeof askAtlassian>[0], 'fetcher'>,
  ): Promise<JiraAnswer> {
    return askAtlassian({ ...props, fetcher: this.fetcher });
  }
}
