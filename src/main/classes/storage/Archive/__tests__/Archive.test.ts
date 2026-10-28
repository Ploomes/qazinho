import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Archive } from '@/main/classes/storage/Archive';

let root: string;
let archive: Archive;

const SAVED = {
  id: 'w1',
  json: '{ "id": "w1", "name": "Checkout regression" }',
  planYaml: 'cases:\n  - id: TC-01\n',
};

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'qazinho-archive-'));
  archive = new Archive(root);
});

describe('Archive', () => {
  it('a machine that has never run QAzinho has no projects and no workspaces', async () => {
    expect(await archive.read()).toEqual({ projects: '[]', workspaces: [] });
  });

  it('reads back exactly what it wrote', async () => {
    await archive.saveProjects('[{"id":"p1"}]');
    await archive.saveWorkspace(SAVED);

    expect(await archive.read()).toEqual({
      projects: '[{"id":"p1"}]',
      workspaces: [SAVED],
    });
  });

  it('writes the plan as its own file, so a QA can open it in an editor', async () => {
    await archive.saveWorkspace(SAVED);

    const read = await archive.read();

    expect(read.workspaces[0]?.planYaml).toBe('cases:\n  - id: TC-01\n');
  });

  it('removing a workspace takes its folder with it', async () => {
    await archive.saveWorkspace(SAVED);
    await archive.removeWorkspace('w1');

    expect((await archive.read()).workspaces).toEqual([]);
  });

  it('removing a workspace takes the screenshots of its runs too', async () => {
    const shots = join(root, 'runs', 'w1', 'r-01');

    await archive.saveWorkspace(SAVED);
    await mkdir(shots, { recursive: true });
    await writeFile(join(shots, 'step-1.jpg'), 'jpeg');
    await archive.removeWorkspace('w1');

    expect(existsSync(join(root, 'runs', 'w1'))).toBe(false);
  });

  it('removing a workspace that was never there is not an error', async () => {
    await expect(archive.removeWorkspace('gone')).resolves.toBeUndefined();
  });

  it('a workspace folder with no workspace file in it is skipped', async () => {
    await archive.saveWorkspace({ ...SAVED, json: '' });

    expect((await archive.read()).workspaces).toEqual([]);
  });

  it('hands a screenshot it wrote back as an image the page can draw', async () => {
    const file = join(root, 'shot.jpg');

    await writeFile(file, Buffer.from([255, 216, 255]));

    expect(await archive.readShot(file)).toBe('data:image/jpeg;base64,/9j/');
  });

  it('refuses a file outside its own folder, however it is asked for', async () => {
    expect(await archive.readShot('/etc/passwd')).toBeNull();
    expect(await archive.readShot(join(root, '..', '..', '.ssh', 'id_rsa'))).toBeNull();
  });

  it('hands over the bytes of a screenshot it keeps, and of nothing outside it', async () => {
    const file = join(root, 'runs', 'w1', 'r-01', 'step-1.jpg');

    await mkdir(join(root, 'runs', 'w1', 'r-01'), { recursive: true });
    await writeFile(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    expect(await archive.readShotBytes(file)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );
    expect(await archive.readShotBytes('/etc/passwd')).toBeNull();
    expect(await archive.readShotBytes(join(root, 'gone.jpg'))).toBeNull();
  });

  it('a screenshot that is no longer on disk is nothing, not a crash', async () => {
    expect(await archive.readShot(join(root, 'gone.jpg'))).toBeNull();
  });

  /**
   * Fechar o app no meio de uma run perdia o último passo que chegou: o salvamento dele
   * ainda estava a caminho quando o app saiu, e a run que o QA tinha visto nunca chegava
   * ao disco.
   */
  it('says a save is on its way, and waits for it before the app may quit', async () => {
    const saving = archive.saveWorkspace(SAVED);

    expect(archive.isWriting()).toBe(true);

    await archive.settle();

    expect(archive.isWriting()).toBe(false);
    expect((await archive.read()).workspaces).toEqual([SAVED]);
    await saving;
  });

  it('has nothing on its way once every save landed', async () => {
    await archive.saveProjects('[]');

    expect(archive.isWriting()).toBe(false);
  });

  describe('a plan.yaml that does not read', () => {
    const BROKEN =
      'cases:\n  - id: TC-01\n    steps:\n      - action: Open\n        expected: "opens\n';

    /**
     * Salvar o plano vazio que a página mostraria escrevia por cima do arquivo do próprio
     * QA.
     */
    it('sets it aside, so nothing writes over it, and says where and at which line', async () => {
      await archive.saveWorkspace({ ...SAVED, planYaml: BROKEN });

      const [read] = (await archive.read()).workspaces;
      const aside = read?.unreadPlan?.file ?? '';

      expect(read).toMatchObject({ planYaml: '', unreadPlan: { line: 6 } });
      expect(aside).toMatch(/^plan\.unread-\d{8}-\d{6}\.yaml$/);
      expect(existsSync(join(root, 'workspaces', 'w1', 'plan.yaml'))).toBe(false);
      expect(await archive.readUnreadPlan({ workspaceId: 'w1', file: aside })).toEqual({
        status: 'unreadable',
        line: 6,
      });
    });

    it('hands it back once the QA fixed it, and lets it go', async () => {
      await archive.saveWorkspace({ ...SAVED, planYaml: BROKEN });

      const aside = (await archive.read()).workspaces[0]?.unreadPlan?.file ?? '';
      const file = archive.unreadPlanFile({ workspaceId: 'w1', file: aside }) ?? '';

      await writeFile(file, 'cases:\n  - id: TC-01\n');

      expect(await archive.readUnreadPlan({ workspaceId: 'w1', file: aside })).toEqual({
        status: 'read',
        yaml: 'cases:\n  - id: TC-01\n',
      });
      expect(existsSync(file)).toBe(false);
      expect(await archive.readUnreadPlan({ workspaceId: 'w1', file: aside })).toEqual({
        status: 'gone',
      });
    });

    it('does NOT reach a file by a name it never gave', async () => {
      await archive.saveWorkspace(SAVED);

      expect(
        archive.unreadPlanFile({ workspaceId: 'w1', file: 'workspace.json' }),
      ).toBeNull();
      expect(
        archive.unreadPlanFile({
          workspaceId: '..',
          file: 'plan.unread-20261023-052607.yaml',
        }),
      ).toBeNull();
      expect(
        await archive.readUnreadPlan({ workspaceId: 'w1', file: '../../projects.json' }),
      ).toEqual({ status: 'gone' });
    });

    /**
     * A janela recarregou antes de a página salvar o que sabia: a próxima leitura ainda
     * precisa dizer isso.
     */
    it('says so again on every read until a plan is saved', async () => {
      await archive.saveWorkspace({ ...SAVED, planYaml: BROKEN });

      const first = (await archive.read()).workspaces[0]?.unreadPlan;

      expect((await archive.read()).workspaces[0]).toMatchObject({
        planYaml: '',
        unreadPlan: first,
      });

      await archive.saveWorkspace({ ...SAVED, planYaml: 'cases: []\n' });

      expect((await archive.read()).workspaces[0]?.unreadPlan).toBeUndefined();
    });

    it('takes back on its own a file the QA fixed before QAzinho read it again', async () => {
      await archive.saveWorkspace({ ...SAVED, planYaml: BROKEN });

      const aside = (await archive.read()).workspaces[0]?.unreadPlan?.file ?? '';

      await writeFile(
        archive.unreadPlanFile({ workspaceId: 'w1', file: aside }) ?? '',
        'cases:\n  - id: TC-01\n',
      );

      expect((await archive.read()).workspaces[0]).toEqual({
        ...SAVED,
        planYaml: 'cases:\n  - id: TC-01\n',
      });
    });
  });
});
