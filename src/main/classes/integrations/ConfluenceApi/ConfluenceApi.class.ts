import type { IConfluenceApi } from './types';
import type { JiraAnswer, JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import type { IJiraCredentials } from '@/main/types';
import type {
  ConfluencePageList,
  ConfluenceRead,
  ConfluenceSpaceList,
  IPublishPlan,
  JiraFailure,
  PlanPublished,
} from '@/shared/types';
import { adfOfReport, askAtlassian } from '@/main/classes/integrations/JiraApi/library';
import { CONFLUENCE } from './constants';
import {
  confluencePageOf,
  confluencePagesOf,
  confluenceSpacesOf,
  cqlOf,
} from './library';

/** Talks to the QA's Confluence on their Jira site, with the same credentials: finds and reads a page of test cases, and publishes a plan as a page. */
export class ConfluenceApi {
  private readonly credentials: () => Promise<IJiraCredentials | null>;
  private readonly jira: () => Promise<IJiraCredentials | null>;
  private readonly fetcher: JiraFetcher;

  public constructor(props: IConfluenceApi) {
    this.credentials = props.credentials;
    this.jira = props.jira;
    this.fetcher = props.fetcher;
  }

  /** Whether the QA's Jira account reaches Confluence on the same site, before it is turned on. */
  public async check(): Promise<
    { isOk: true } | { isOk: false; failure: JiraFailure; said: string }
  > {
    const signed = await this.jira();

    if (signed === null) return { isOk: false, failure: 'not-connected', said: '' };

    const answer = await this.ask({ signed, path: '/wiki/api/v2/spaces?limit=1' });

    return answer.isOk ? { isOk: true } : answer;
  }

  /** The spaces a plan can be published in, by name. */
  public async spaces(): Promise<ConfluenceSpaceList> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const answer = await this.ask({
      signed,
      path: `/wiki/api/v2/spaces?limit=${String(CONFLUENCE.spaces)}`,
    });

    return answer.isOk
      ? { isListed: true, spaces: confluenceSpacesOf(answer.body) }
      : { isListed: false, failure: answer.failure };
  }

  /** The pages whose title holds what the QA typed, or the ones they worked on last. */
  public async search(query: string): Promise<ConfluencePageList> {
    const signed = await this.credentials();

    if (signed === null) return { isListed: false, failure: 'not-connected' };

    const params = new URLSearchParams({
      cql: cqlOf(query),
      limit: String(CONFLUENCE.pickerSize),
    });
    const answer = await this.ask({
      signed,
      path: `/wiki/rest/api/search?${params.toString()}`,
    });

    return answer.isOk
      ? {
          isListed: true,
          pages: confluencePagesOf({ answer: answer.body, site: signed.site }),
        }
      : { isListed: false, failure: answer.failure };
  }

  /** One page read whole, its body as Markdown, or why Confluence did not hand it over. */
  public async page(id: string): Promise<ConfluenceRead> {
    const signed = await this.credentials();

    if (signed === null) return { isRead: false, failure: 'not-connected', said: '' };

    const answer = await this.ask({
      signed,
      path: `/wiki/api/v2/pages/${encodeURIComponent(id)}?body-format=atlas_doc_format`,
    });

    if (!answer.isOk)
      return { isRead: false, failure: answer.failure, said: answer.said };

    const read = confluencePageOf({ answer: answer.body, site: signed.site });

    return read === null
      ? { isRead: false, failure: 'unexpected', said: '' }
      : { isRead: true, page: read.page, text: read.text };
  }

  /** Publishes a plan: a new page in the space, under the parent page when there is one, or the next version of the page it was published on before; one that is gone is made again. */
  public async publish(plan: IPublishPlan): Promise<PlanPublished> {
    const signed = await this.credentials();

    if (signed === null)
      return { isPublished: false, failure: 'not-connected', said: '' };

    const body = {
      representation: 'atlas_doc_format',
      value: JSON.stringify(adfOfReport({ title: plan.title, blocks: plan.blocks })),
    };
    const current =
      plan.pageId === null
        ? null
        : await this.ask({
            signed,
            path: `/wiki/api/v2/pages/${encodeURIComponent(plan.pageId)}`,
          });

    if (current !== null && !current.isOk && current.failure !== 'not-found')
      return { isPublished: false, failure: current.failure, said: current.said };

    const kept =
      current?.isOk === true
        ? confluencePageOf({ answer: current.body, site: signed.site })
        : null;
    const answer =
      kept === null
        ? await this.ask({
            signed,
            path: '/wiki/api/v2/pages',
            method: 'POST',
            json: {
              spaceId: plan.spaceId,
              status: 'current',
              title: plan.title,
              ...(plan.parentId === null ? {} : { parentId: plan.parentId }),
              body,
            },
          })
        : await this.ask({
            signed,
            path: `/wiki/api/v2/pages/${encodeURIComponent(kept.page.id)}`,
            method: 'PUT',
            json: {
              id: kept.page.id,
              status: 'current',
              title: plan.title,
              spaceId: kept.spaceId || plan.spaceId,
              body,
              version: { number: kept.version + 1, message: CONFLUENCE.versionMessage },
            },
          });

    if (!answer.isOk)
      return { isPublished: false, failure: answer.failure, said: answer.said };

    const made = confluencePageOf({ answer: answer.body, site: signed.site });

    return made === null
      ? { isPublished: false, failure: 'unexpected', said: '' }
      : { isPublished: true, page: made.page };
  }

  private ask(
    props: Omit<Parameters<typeof askAtlassian>[0], 'fetcher'>,
  ): Promise<JiraAnswer> {
    return askAtlassian({ ...props, fetcher: this.fetcher });
  }
}
