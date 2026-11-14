import type { ISaveSkill } from '@/shared/types';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SkillLibrary } from '@/main/classes/skills/SkillLibrary';

let root = '';
let home = '';
let commit = 'c1';
let ids = 0;

const SKILL_MD =
  '---\nname: cases-gherkin\ndescription: When writing cases\n---\n\nGherkin.\n';

/** Um gh falso que serve uma pasta de skills num repositório, num commit que o teste move. */
const github = {
  api: ({ path }: { path: string }) => {
    if (path.includes('/commits/'))
      return Promise.resolve({ isOk: true as const, text: commit });
    if (path.includes('/git/trees/'))
      return Promise.resolve({
        isOk: true as const,
        text: JSON.stringify({
          tree: [
            { path: 'qa/skills/cases/SKILL.md', type: 'blob', sha: 'b1', size: 80 },
            { path: 'qa/skills/cases/model.md', type: 'blob', sha: 'b2', size: 10 },
          ],
        }),
      });
    if (path.endsWith('/b1'))
      return Promise.resolve({
        isOk: true as const,
        text: Buffer.from(
          commit === 'c1' ? SKILL_MD : SKILL_MD.replace('Gherkin.', 'Gherkin, v2.'),
        ).toString('base64'),
      });

    return Promise.resolve({
      isOk: true as const,
      text: Buffer.from('model').toString('base64'),
    });
  },
};

const library = () =>
  new SkillLibrary({
    root,
    home,
    github,
    now: () => 0,
    newId: () => {
      ids += 1;

      return `sk-${String(ids)}`;
    },
  });

const input = (props: Partial<ISaveSkill>): ISaveSkill => ({
  id: null,
  name: 'Casos Gherkin',
  description: 'When writing cases',
  body: '## Format\nGherkin.',
  use: 'cases',
  projectIds: null,
  isOn: true,
  draftId: null,
  ...props,
});

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'qz-skills-'));
  home = await mkdtemp(join(tmpdir(), 'qz-home-'));
  commit = 'c1';
  ids = 0;
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(home, { recursive: true, force: true });
});

describe('SkillLibrary', () => {
  it('keeps a new skill as a SKILL.md of the standard, and lists it back', async () => {
    const saved = await library().save(input({}));

    expect(saved).toMatchObject({
      isSaved: true,
      skill: { id: 'sk-1', name: 'casos-gherkin' },
    });
    expect(await readFile(join(root, 'sk-1', 'SKILL.md'), 'utf8')).toContain(
      'name: casos-gherkin\ndescription: When writing cases',
    );
    expect(await library().list()).toEqual([
      expect.objectContaining({ id: 'sk-1', body: '## Format\nGherkin.', isOn: true }),
    ]);
  });

  it('says why it does NOT keep a skill with no name, no instructions, or a name taken', async () => {
    expect(await library().save(input({ name: '!!' }))).toEqual({
      isSaved: false,
      reason: 'no-name',
    });
    expect(await library().save(input({ body: ' ' }))).toEqual({
      isSaved: false,
      reason: 'no-body',
    });

    await library().save(input({}));

    expect(await library().save(input({}))).toEqual({ isSaved: false, reason: 'taken' });
  });

  it('lists the skills of this computer to import, and brings them in turned off', async () => {
    await mkdir(join(home, '.claude', 'skills', 'cases'), { recursive: true });
    await writeFile(join(home, '.claude', 'skills', 'cases', 'SKILL.md'), SKILL_MD);

    const [found] = await library().found();

    expect(found).toMatchObject({ name: 'cases-gherkin', isKept: false });

    const [imported] = await library().import({
      from: 'computer',
      paths: [found?.path ?? ''],
    });

    expect(imported).toMatchObject({ isOn: false, source: { kind: 'computer' } });
    expect((await library().found())[0]?.isKept).toBe(true);
  });

  it('reads the skills of a folder in a repository, and keeps the commit they came from', async () => {
    const found = await library().foundIn({
      repository: 'shop/qa',
      branch: 'main',
      folder: 'qa/skills',
    });

    expect(found).toEqual({
      isFound: true,
      commit: 'c1',
      skills: [
        {
          name: 'cases-gherkin',
          description: 'When writing cases',
          path: 'cases',
          isKept: false,
        },
      ],
    });

    const [imported] = await library().import({
      from: 'repo',
      repository: 'shop/qa',
      branch: 'main',
      folder: 'qa/skills',
      names: ['cases'],
    });

    expect(imported).toMatchObject({
      files: ['model.md'],
      source: { kind: 'repo', folder: 'qa/skills/cases', commit: 'c1' },
    });
    expect(await readFile(join(root, 'sk-1', 'model.md'), 'utf8')).toBe('model');
  });

  it('reads a repository skill again once its branch moved, keeping where it is on', async () => {
    const [imported] = await library().import({
      from: 'repo',
      repository: 'shop/qa',
      branch: 'main',
      folder: 'qa/skills',
      names: ['cases'],
    });

    await library().save(input({ id: imported?.id ?? '', isOn: true, use: 'explore' }));
    commit = 'c2';
    await library().refresh();

    expect((await library().list())[0]).toMatchObject({
      body: 'Gherkin, v2.',
      isOn: true,
      use: 'explore',
      source: { commit: 'c2' },
    });
  });

  it('changes only where an imported skill is on, never its instructions', async () => {
    const [imported] = await library().import({
      from: 'repo',
      repository: 'shop/qa',
      branch: 'main',
      folder: 'qa/skills',
      names: ['cases'],
    });

    await library().save(
      input({ id: imported?.id ?? '', body: 'Changed here.', isOn: true }),
    );

    expect((await library().list())[0]).toMatchObject({ body: 'Gherkin.', isOn: true });
  });

  it('keeps the files the QA attached to a draft with the skill it became', async () => {
    const file = join(home, 'cts.md');

    await writeFile(file, '# Cases');

    expect(await library().attach({ draftId: 'd1', paths: [file] })).toEqual([
      { name: 'cts.md', isImage: false },
    ]);

    const saved = await library().save(input({ draftId: 'd1' }));

    expect(saved).toMatchObject({ isSaved: true, skill: { files: ['cts.md'] } });
    expect(await readFile(join(root, 'sk-1', 'cts.md'), 'utf8')).toBe('# Cases');
  });

  it('hands a chat the skills on for it, with the folder the agent may read', async () => {
    await library().save(input({}));
    await library().save(input({ name: 'off', isOn: false }));

    expect(
      await library().forChat({ projectId: 'p1', uses: ['cases'], calledId: null }),
    ).toEqual([
      expect.objectContaining({
        name: 'casos-gherkin',
        dir: join(root, 'sk-1'),
        isCalled: false,
      }),
    ]);
  });

  it('copies a skill out to a folder the QA picked, under its name', async () => {
    await library().save(input({}));
    const target = await library().export({ id: 'sk-1', dir: home });

    expect(target).toBe(join(home, 'casos-gherkin'));
    expect(await readFile(join(home, 'casos-gherkin', 'SKILL.md'), 'utf8')).toContain(
      'Gherkin.',
    );
  });
});
