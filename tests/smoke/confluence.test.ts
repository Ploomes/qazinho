import type { BugReportBlock } from '@/shared/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness } from '@/harness';
import { ConfluenceApi } from '@/main/classes/integrations';
import { fakeConfluence } from './fixtures/fakeConfluence';
import { JIRA_EMAIL, JIRA_TOKEN } from './fixtures/fakeJira';

const PORT = 4366;
const SITE = `http://127.0.0.1:${String(PORT)}`;

const confluence = fakeConfluence();

/** Confluence on beside Jira, or off: `credentials` answers only when it is on, `jira` always. */
const apiOf = (props: { isOn: boolean; token?: string }) => {
  const signed = { site: SITE, email: JIRA_EMAIL, token: props.token ?? JIRA_TOKEN };

  return new ConfluenceApi({
    credentials: () => Promise.resolve(props.isOn ? signed : null),
    jira: () => Promise.resolve(signed),
    fetcher: (url, init) => fetch(url, init),
  });
};

const api = apiOf({ isOn: true });

/** A plan as the Plan tab writes it out, its steps in a table. */
const planBlocks = (title: string): BugReportBlock[] => [
  { kind: 'paragraph', text: '1 case, 2 steps.' },
  { kind: 'heading', text: `TC-01 · ${title}` },
  { kind: 'facts', items: [{ label: 'Priority', value: 'P1', url: null }] },
  {
    kind: 'table',
    head: ['#', 'Action', 'Expected'],
    rows: [
      ['1', 'Aplicar SAVE10', '10% off'],
      ['2', 'Fechar o pedido', 'O total pago tem o desconto'],
    ],
  },
  { kind: 'paragraph', text: 'Published from QAzinho.' },
];

const blocks = planBlocks('Cupom válido');

beforeAll(async () => {
  await new Promise<void>((ready) => confluence.server.listen(PORT, '127.0.0.1', ready));
});

afterAll(() => {
  confluence.server.close();
});

describe('Confluence beside Jira', () => {
  it('checks the Jira account reaches Confluence before it is turned on', async () => {
    expect(await apiOf({ isOn: false }).check()).toEqual({ isOk: true });
    expect(await apiOf({ isOn: false, token: 'wrong' }).check()).toMatchObject({
      isOk: false,
      failure: 'unauthorized',
    });
  });

  it('answers nothing while it is off', async () => {
    expect(await apiOf({ isOn: false }).search('')).toEqual({
      isListed: false,
      failure: 'not-connected',
    });
  });

  it('finds a page by its title, and reads its cases for the agent', async () => {
    const found = await api.search('checkout');

    expect(found).toEqual({
      isListed: true,
      pages: [
        {
          id: '98304',
          title: 'Checkout: cenários',
          space: 'Quality',
          url: `${SITE}/wiki/spaces/QA/pages/98304`,
        },
      ],
    });

    const read = await api.page('98304');

    expect(read.isRead).toBe(true);

    const text = read.isRead ? read.text : '';

    expect(text).toContain('CT01 · Cupom válido');
    expect(text).toContain('Aplicar SAVE10');

    const chat = new Harness().chat({
      text: 'Plan the tests from the Confluence page “Checkout: cenários”.',
      told: {},
      target: null,
      viewport: null,
      steps: [],
      references: [],
      runs: [],
      look: null,
      code: null,
      story: null,
      page: read.isRead ? { page: read.page, text: read.text } : null,
      design: null,
      variables: [],
    });

    expect(chat.prompt).toContain('## The Confluence page\nCheckout: cenários');
    expect(chat.prompt).toContain('  ## CT01 · Cupom válido');
    expect(chat.systemPrompt).toContain('## Planning from a Confluence page');
    expect(chat.readDirs).toEqual([]);
  });

  it('says a page that is not there is not found', async () => {
    expect(await api.page('404404')).toMatchObject({
      isRead: false,
      failure: 'not-found',
    });
  });

  it('lists the spaces to publish in, by name', async () => {
    expect(await api.spaces()).toEqual({
      isListed: true,
      spaces: [
        { id: '10', key: 'ENG', name: 'Engineering' },
        { id: '9', key: 'QA', name: 'Quality' },
      ],
    });
  });

  it('publishes a plan as a new page, updates it as its next version, and reads it back', async () => {
    const made = await api.publish({
      pageId: null,
      spaceId: '9',
      parentId: '98304',
      title: 'Plano · Checkout',
      blocks,
    });

    expect(made.isPublished).toBe(true);

    const id = made.isPublished ? made.page.id : '';

    expect(confluence.pages.get(id)).toMatchObject({
      title: 'Plano · Checkout',
      spaceId: '9',
      parentId: '98304',
      version: 1,
    });

    const again = await api.publish({
      pageId: id,
      spaceId: '9',
      parentId: '98304',
      title: 'Plano · Checkout',
      blocks: planBlocks('Cupom válido no checkout'),
    });

    expect(again).toMatchObject({ isPublished: true, page: { id } });
    expect(confluence.pages.get(id)?.version).toBe(2);

    const read = await api.page(id);
    const text = read.isRead ? read.text : '';

    expect(text).toContain('TC-01 · Cupom válido no checkout');
    expect(text).toContain('Fechar o pedido');
    expect(text).toContain('Published from QAzinho.');
  });

  it('makes the page again when the one it was published on is gone', async () => {
    const made = await api.publish({
      pageId: '777',
      spaceId: '9',
      parentId: null,
      title: 'Plano · Frete',
      blocks,
    });

    expect(made).toMatchObject({ isPublished: true, page: { title: 'Plano · Frete' } });
    expect(confluence.asked).toContain('POST /wiki/api/v2/pages');
  });

  it("says why Confluence refused the plan, in Confluence's words", async () => {
    expect(
      await api.publish({
        pageId: null,
        spaceId: '9',
        parentId: null,
        title: 'Checkout: cenários',
        blocks,
      }),
    ).toEqual({
      isPublished: false,
      failure: 'rejected',
      said: 'A page with this title already exists in this space',
    });
  });
});
