import type { ProAnswer } from '@/main/classes/pro/ProApi';
import type {
  ORG_TEMPLATE_SCHEMA,
  ORG_TEMPLATES_SCHEMA,
} from '@/main/classes/pro/ProApi/constants';
import type { IProTemplates } from '@/main/classes/pro/ProTemplates';
import type { z } from 'zod';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ProTemplates } from '@/main/classes/pro/ProTemplates';

type Template = z.infer<typeof ORG_TEMPLATE_SCHEMA>;

const TEMPLATE: Template = {
  id: 'a1',
  kind: 'bug',
  name: 'Bug do time',
  title: '[{{app}}] {{title}}',
  parts: [{ kind: 'section', field: 'steps', heading: 'Passos' }],
  cases: 'steps',
  isDefault: false,
  author: { id: 'u1', name: 'Ana' },
  updatedAt: '2026-11-13T15:00:00.000Z',
};

/** Uma plataforma que responde o que o teste manda, e lembra cada pedido. */
function fakeApi(answers: {
  list?: ProAnswer<z.infer<typeof ORG_TEMPLATES_SCHEMA>>;
  save?: ProAnswer<Template>;
  done?: ProAnswer<null>;
}) {
  const calls: { name: string; props: unknown }[] = [];
  const api: IProTemplates['api'] = {
    templates: (props) => {
      calls.push({ name: 'templates', props });

      return Promise.resolve(
        answers.list ?? { isOk: false, status: 0, error: 'unreachable' },
      );
    },
    saveTemplate: (props) => {
      calls.push({ name: 'saveTemplate', props });

      return Promise.resolve(
        answers.save ?? { isOk: false, status: 0, error: 'unreachable' },
      );
    },
    removeTemplate: (props) => {
      calls.push({ name: 'removeTemplate', props });

      return Promise.resolve(answers.done ?? { isOk: true, value: null });
    },
    setDefaultTemplate: (props) => {
      calls.push({ name: 'setDefaultTemplate', props });

      return Promise.resolve(answers.done ?? { isOk: true, value: null });
    },
  };

  return { api, calls };
}

async function fileOf() {
  return join(
    await mkdtemp(join(tmpdir(), 'qazinho-org-templates-')),
    'org-templates.json',
  );
}

describe('ProTemplates', () => {
  it('lists an org’s templates and keeps them for when there is no connection', async () => {
    const file = await fileOf();
    const online = fakeApi({
      list: {
        isOk: true,
        value: { templates: [TEMPLATE], canPublish: true, canSetDefault: false },
      },
    });
    const offline = fakeApi({});

    const listed = await new ProTemplates({
      api: online.api,
      token: () => Promise.resolve('qzm_token'),
      file,
    }).list('loja');
    const kept = await new ProTemplates({
      api: offline.api,
      token: () => Promise.resolve('qzm_token'),
      file,
    }).list('loja');

    expect(listed).toMatchObject({
      isListed: true,
      list: { orgSlug: 'loja', canPublish: true, templates: [{ id: 'org:loja:a1' }] },
    });
    expect(kept).toEqual(listed);
  });

  it('says why an org it never read could not be listed', async () => {
    const { api } = fakeApi({ list: { isOk: false, status: 403, error: 'forbidden' } });
    const templates = new ProTemplates({
      api,
      token: () => Promise.resolve('qzm_token'),
      file: await fileOf(),
    });

    expect(await templates.list('loja')).toEqual({
      isListed: false,
      failure: 'forbidden',
    });
  });

  it('asks nothing of the platform while signed out', async () => {
    const { api, calls } = fakeApi({});
    const templates = new ProTemplates({
      api,
      token: () => Promise.resolve(null),
      file: await fileOf(),
    });

    expect(await templates.list('loja')).toEqual({
      isListed: false,
      failure: 'signed-out',
    });
    expect(calls).toEqual([]);
  });

  it('publishes a new one, and rewrites one by the id the org gave', async () => {
    const { api, calls } = fakeApi({ save: { isOk: true, value: TEMPLATE } });
    const templates = new ProTemplates({
      api,
      token: () => Promise.resolve('qzm_token'),
      file: await fileOf(),
    });
    const draft = {
      kind: 'bug' as const,
      name: ' Bug do time ',
      title: '[{{app}}] {{title}}',
      parts: TEMPLATE.parts,
      cases: 'steps' as const,
    };

    await templates.save({ orgSlug: 'loja', template: { ...draft, id: null } });
    const saved = await templates.save({
      orgSlug: 'loja',
      template: { ...draft, id: 'org:loja:a1' },
    });

    expect(calls.map(({ props }) => props)).toEqual([
      expect.objectContaining({
        org: 'loja',
        id: null,
        body: expect.objectContaining({ name: 'Bug do time' }),
      }),
      expect.objectContaining({ org: 'loja', id: 'a1' }),
    ]);
    expect(saved).toMatchObject({ isSaved: true, template: { id: 'org:loja:a1' } });
  });

  it('never sends a local template to the org as if it were one of its own', async () => {
    const { api, calls } = fakeApi({});
    const templates = new ProTemplates({
      api,
      token: () => Promise.resolve('qzm_token'),
      file: await fileOf(),
    });

    expect(await templates.remove({ orgSlug: 'loja', id: 'tpl-1' })).toEqual({
      isDone: false,
      failure: 'failed',
    });
    expect(calls).toEqual([]);
  });

  it('chooses a default by the org’s id, or none', async () => {
    const { api, calls } = fakeApi({});
    const templates = new ProTemplates({
      api,
      token: () => Promise.resolve('qzm_token'),
      file: await fileOf(),
    });

    await templates.setDefault({ orgSlug: 'loja', kind: 'bug', id: 'org:loja:a1' });
    await templates.setDefault({ orgSlug: 'loja', kind: 'bug', id: null });

    expect(calls.map(({ props }) => props)).toEqual([
      { token: 'qzm_token', org: 'loja', kind: 'bug', id: 'a1' },
      { token: 'qzm_token', org: 'loja', kind: 'bug', id: null },
    ]);
  });
});
