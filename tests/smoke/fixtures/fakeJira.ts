import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';

export const JIRA_EMAIL = 'ana@acme.test';
export const JIRA_TOKEN = 'jira_secret';

const paragraph = (text: string) => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
});

/** A story as Jira Cloud answers it with every field and their names. */
export function storyOf(props: {
  key: string;
  attachments: { id: string; filename: string; mimeType: string; size: number }[];
}) {
  return {
    id: '10012',
    key: props.key,
    fields: {
      summary: 'Aplicar cupom no checkout',
      issuetype: { name: 'Story' },
      status: { name: 'To Do' },
      priority: { name: 'High' },
      labels: ['checkout'],
      components: [],
      description: {
        type: 'doc',
        version: 1,
        content: [
          paragraph('Como cliente, quero aplicar um cupom no checkout para pagar menos.'),
        ],
      },
      customfield_10050: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'bulletList',
            content: [
              { type: 'listItem', content: [paragraph('SAVE10 tira 10% do total')] },
              { type: 'listItem', content: [paragraph('Um cupom expirado é recusado')] },
            ],
          },
        ],
      },
      comment: {
        comments: [
          {
            author: { displayName: 'Ana PO' },
            created: '2026-10-20T13:02:11.000-0300',
            body: {
              type: 'doc',
              version: 1,
              content: [paragraph('Um cupom por pedido.')],
            },
          },
        ],
      },
      issuelinks: [],
      subtasks: [],
      attachment: props.attachments,
    },
    names: { customfield_10050: 'Critérios de aceite' },
  };
}

/**
 * A Jira Cloud site on loopback, for QAzinho's Jira client to talk to: it searches, hands over a
 * story and its files, files a bug with its attachments and links, and remembers what it was
 * asked. Only the email and token it knows are let in.
 */
export function fakeJira(props: {
  files: Record<string, { name: string; mimeType: string; bytes: Buffer }>;
}) {
  const created: {
    project: string;
    type: string;
    summary: string;
    description: unknown;
  }[] = [];
  const attached: {
    key: string;
    filename: string;
    contentType: string;
    bytes: number;
  }[] = [];
  const linked: { type: string; inward: string; outward: string }[] = [];
  const asked: string[] = [];
  const basic = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`;
  const attachments = Object.entries(props.files).map(([id, file]) => ({
    id,
    filename: file.name,
    mimeType: file.mimeType,
    size: file.bytes.length,
  }));

  const body = (request: IncomingMessage) =>
    new Promise<Buffer>((done) => {
      const chunks: Buffer[] = [];

      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        done(Buffer.concat(chunks));
      });
    });

  const json = (response: ServerResponse, answer: { status: number; body: unknown }) => {
    response.writeHead(answer.status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(answer.body));
  };

  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url ?? '/', 'http://jira.test');

      asked.push(`${request.method ?? 'GET'} ${url.pathname}${url.search}`);

      if (request.headers.authorization !== basic) {
        json(response, {
          status: 401,
          body: { errorMessages: ['You are not authenticated.'] },
        });

        return;
      }

      if (url.pathname === '/rest/api/3/issue/picker') {
        const query = (url.searchParams.get('query') ?? '').toLowerCase();

        json(response, {
          status: 200,
          body: {
            sections: [
              {
                id: 'cs',
                label: 'Current Search',
                issues: [
                  { key: 'SHOP-12', summaryText: 'Aplicar cupom no checkout' },
                  { key: 'SHOP-14', summaryText: 'Frete grátis acima de R$ 200' },
                ].filter(({ key, summaryText }) =>
                  query === ''
                    ? true
                    : `${key} ${summaryText}`.toLowerCase().includes(query),
                ),
              },
            ],
          },
        });

        return;
      }

      const issue = /^\/rest\/api\/3\/issue\/([A-Z]+-\d+)$/.exec(url.pathname);

      if (issue !== null && request.method === 'GET') {
        if (issue[1] !== 'SHOP-12') {
          json(response, {
            status: 404,
            body: { errorMessages: ['Issue does not exist'] },
          });

          return;
        }

        json(response, {
          status: 200,
          body:
            url.searchParams.get('fields') === 'summary'
              ? { key: 'SHOP-12', fields: { summary: 'Aplicar cupom no checkout' } }
              : storyOf({ key: 'SHOP-12', attachments }),
        });

        return;
      }

      const content = /^\/rest\/api\/3\/attachment\/content\/(\w+)$/.exec(url.pathname);

      if (content !== null) {
        const file = props.files[content[1] ?? ''];

        if (file === undefined) {
          json(response, { status: 404, body: {} });

          return;
        }

        response.writeHead(200, { 'content-type': file.mimeType });
        response.end(file.bytes);

        return;
      }

      if (url.pathname === '/rest/api/3/project/search') {
        json(response, {
          status: 200,
          body: {
            isLast: true,
            values: [
              { id: '10000', key: 'SHOP', name: 'Loja' },
              { id: '10001', key: 'OPS', name: 'Operações' },
            ],
          },
        });

        return;
      }

      const types = /^\/rest\/api\/3\/issue\/createmeta\/(\w+)\/issuetypes$/.exec(
        url.pathname,
      );

      if (types !== null) {
        json(response, {
          status: 200,
          body: {
            issueTypes: [
              { id: '10001', name: 'Story', subtask: false },
              { id: '10004', name: 'Bug', subtask: false },
              { id: '10005', name: 'Subtask', subtask: true },
            ],
          },
        });

        return;
      }

      if (url.pathname === '/rest/api/3/issue' && request.method === 'POST') {
        const sent = JSON.parse((await body(request)).toString()) as {
          fields: {
            project: { key: string };
            issuetype: { id?: string; name?: string };
            summary: string;
            description: unknown;
          };
        };
        const key = `${sent.fields.project.key}-${String(57 + created.length)}`;

        created.push({
          project: sent.fields.project.key,
          type: sent.fields.issuetype.id ?? sent.fields.issuetype.name ?? '',
          summary: sent.fields.summary,
          description: sent.fields.description,
        });
        json(response, {
          status: 201,
          body: {
            id: '20057',
            key,
            self: `http://jira.test/rest/api/3/issue/${key}`,
          },
        });

        return;
      }

      const attaching = /^\/rest\/api\/3\/issue\/([A-Z]+-\d+)\/attachments$/.exec(
        url.pathname,
      );

      if (attaching !== null && request.method === 'POST') {
        if (request.headers['x-atlassian-token'] !== 'no-check') {
          json(response, { status: 403, body: { errorMessages: ['XSRF check failed'] } });

          return;
        }

        const raw = (await body(request)).toString('latin1');
        const parts = raw.split(/--[^\r\n]+\r\n/).slice(1);

        for (const part of parts) {
          const [head = '', ...rest] = part.split('\r\n\r\n');
          const filename = /filename="([^"]+)"/.exec(head)?.[1];

          if (filename === undefined) continue;

          attached.push({
            key: attaching[1] ?? '',
            filename,
            contentType: /Content-Type: ([^\r\n]+)/i.exec(head)?.[1] ?? '',
            bytes: Buffer.byteLength(
              rest
                .join('\r\n\r\n')
                .replace(/\r\n--[^\r\n]*--\r\n?$/, '')
                .replace(/\r\n$/, ''),
              'latin1',
            ),
          });
        }

        json(response, {
          status: 200,
          body: attached.map(({ filename }) => ({ filename })),
        });

        return;
      }

      if (url.pathname === '/rest/api/3/issueLink' && request.method === 'POST') {
        const sent = JSON.parse((await body(request)).toString()) as {
          type: { name: string };
          inwardIssue: { key: string };
          outwardIssue: { key: string };
        };

        linked.push({
          type: sent.type.name,
          inward: sent.inwardIssue.key,
          outward: sent.outwardIssue.key,
        });
        response.writeHead(201).end();

        return;
      }

      json(response, { status: 404, body: { errorMessages: ['No route'] } });
    })();
  });

  return { server, created, attached, linked, asked };
}
