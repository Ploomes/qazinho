import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TemplateLibrary } from '@/main/classes/projects/TemplateLibrary';

const DRAFT = {
  id: null,
  kind: 'bug' as const,
  name: ' Bug do time ',
  title: '[Checkout] {{title}}',
  parts: [{ kind: 'section' as const, field: 'steps', heading: 'Passos' }],
  cases: 'steps' as const,
};

async function library() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-templates-'));
  let ids = 0;

  return {
    file: join(root, 'templates.json'),
    templates: new TemplateLibrary({
      file: join(root, 'templates.json'),
      now: () => '2026-11-13T15:00:00.000Z',
      newId: () => `t-${String((ids += 1))}`,
    }),
  };
}

describe('TemplateLibrary', () => {
  it('keeps a new template with an id, and lists it back', async () => {
    const { templates, file } = await library();

    expect(await templates.save(DRAFT)).toEqual({
      isSaved: true,
      template: {
        ...DRAFT,
        id: 't-1',
        name: 'Bug do time',
        updatedAt: '2026-11-13T15:00:00.000Z',
      },
    });
    expect((await templates.list()).map(({ id }) => id)).toEqual(['t-1']);
    expect(await readFile(file, 'utf8')).toContain('Bug do time');
  });

  it('writes a template over the one with its id, and removes one', async () => {
    const { templates } = await library();

    await templates.save(DRAFT);
    await templates.save({ ...DRAFT, name: 'Outro' });
    await templates.save({ ...DRAFT, id: 't-1', name: 'Bug do time, v2' });

    expect((await templates.list()).map(({ name }) => name)).toEqual([
      'Bug do time, v2',
      'Outro',
    ]);
    expect(await templates.remove('t-2')).toBe(true);
    expect((await templates.list()).map(({ id }) => id)).toEqual(['t-1']);
  });

  it('does NOT keep a template with no name', async () => {
    const { templates } = await library();

    expect(await templates.save({ ...DRAFT, name: '  ' })).toEqual({
      isSaved: false,
      reason: 'unnamed',
    });
  });
});
