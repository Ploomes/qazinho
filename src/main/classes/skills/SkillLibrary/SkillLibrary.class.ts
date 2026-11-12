import type {
  IGithubSkills,
  ISkillEntry,
  ISkillLibrary,
} from '@/main/classes/skills/SkillLibrary/types';
import type {
  ISaveSkill,
  ISkill,
  ISkillDraftFile,
  ISkillFound,
  ISkillImport,
  ITeamSkill,
  SkillSaved,
  SkillsFound,
  SkillUse,
} from '@/shared/types';
import { randomUUID } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { refPath } from '@/main/classes/integrations/CodeCopies/library';
import { SKILL_LIBRARY } from '@/main/classes/skills/SkillLibrary/constants';
import {
  computerSkillDirs,
  markdownOfSkill,
  repoSkillFilesOf,
  skillNameOf,
  skillOfMarkdown,
  skillsForChat,
} from '@/main/classes/skills/SkillLibrary/library';

/**
 * As skills do time neste computador: cada uma numa pasta com o SKILL.md e os arquivos
 * dela, e um índice com onde vale, se está ligada e de onde veio.
 */
export class SkillLibrary {
  private readonly root: string;
  private readonly home: string;
  private readonly github: IGithubSkills;
  private readonly now: () => number;
  private readonly newId: () => string;

  public constructor(props: ISkillLibrary) {
    this.root = props.root;
    this.home = props.home;
    this.github = props.github;
    this.now = props.now ?? Date.now;
    this.newId = props.newId ?? (() => `sk-${randomUUID().slice(0, 8)}`);
  }

  /** Toda skill guardada, lida do SKILL.md dela; uma que sumiu do disco fica de fora. */
  public async list(): Promise<ISkill[]> {
    const entries = await this.readIndex();
    const skills = await Promise.all(entries.map((entry) => this.skillOf(entry)));

    return skills.filter((skill): skill is ISkill => skill !== null);
  }

  /**
   * Guarda uma skill nova ou as mudanças numa que existe; numa que veio de fora só muda
   * onde vale, os projetos e se está ligada.
   */
  public async save(input: ISaveSkill): Promise<SkillSaved> {
    const entries = await this.readIndex();
    const kept =
      input.id === null ? undefined : entries.find(({ id }) => id === input.id);
    const name = skillNameOf(input.name);
    const description = input.description.trim();
    const body = input.body.trim();

    if (kept === undefined || kept.source.kind === 'created') {
      if (name === '') return { isSaved: false, reason: 'no-name' };
      if (description === '') return { isSaved: false, reason: 'no-description' };
      if (body === '') return { isSaved: false, reason: 'no-body' };
      if (
        body.length > SKILL_LIBRARY.bodyMax ||
        description.length > SKILL_LIBRARY.descriptionMax
      )
        return { isSaved: false, reason: 'too-large' };

      const others = await this.list();

      if (others.some((one) => one.name === name && one.id !== kept?.id))
        return { isSaved: false, reason: 'taken' };
    }

    const id = kept?.id ?? this.newId();
    const dir = this.dirOf(id);
    const entry: ISkillEntry = {
      id,
      use: input.use,
      projectIds: input.projectIds,
      isOn: input.isOn,
      source: kept?.source ?? { kind: 'created' },
      files: kept?.files ?? [],
      updatedAt: new Date(this.now()).toISOString(),
    };

    await mkdir(dir, { recursive: true });

    if (entry.source.kind === 'created') {
      await writeFile(
        join(dir, SKILL_LIBRARY.skillFile),
        markdownOfSkill({ name, description, body }),
      );

      if (input.draftId !== null) {
        entry.files = [
          ...new Set([
            ...entry.files,
            ...(await this.keepDraft({ draftId: input.draftId, dir })),
          ]),
        ];
      }
    }

    await this.writeIndex([...entries.filter((one) => one.id !== id), entry]);

    const skill = await this.skillOf(entry);

    return skill === null
      ? { isSaved: false, reason: 'no-body' }
      : { isSaved: true, skill };
  }

  /** Apaga uma skill e a pasta dela. */
  public async remove(id: string): Promise<void> {
    const entries = await this.readIndex();

    await rm(this.dirOf(id), { recursive: true, force: true });
    await this.writeIndex(entries.filter((entry) => entry.id !== id));
  }

  /** As skills que o Claude Code e o Codex guardam neste computador, para importar. */
  public async found(): Promise<ISkillFound[]> {
    const entries = await this.readIndex();
    const kept = new Set(
      entries.flatMap(({ source }) => (source.kind === 'computer' ? [source.path] : [])),
    );
    const found = await Promise.all(
      computerSkillDirs(this.home).map(async (folder) => {
        const names = await readdir(folder).catch(() => [] as string[]);

        return Promise.all(
          names.map(async (name) => {
            const path = join(folder, name);
            const text = await readFile(
              join(path, SKILL_LIBRARY.skillFile),
              'utf8',
            ).catch(() => null);
            const read =
              text === null ? null : skillOfMarkdown({ text, fallbackName: name });

            return read === null
              ? []
              : [
                  {
                    name: read.name,
                    description: read.description,
                    path,
                    isKept: kept.has(path),
                  },
                ];
          }),
        );
      }),
    );

    return found.flat(2);
  }

  /**
   * As skills de uma pasta de um repositório numa branch, lidas pelo gh do QA, com o
   * commit em que foram lidas.
   */
  public async foundIn(props: {
    repository: string;
    branch: string;
    folder: string;
  }): Promise<SkillsFound> {
    const read = await this.readRepo(props);

    if (!read.isRead) return { isFound: false, reason: read.reason, said: read.said };

    const entries = await this.readIndex();
    const kept = new Set(
      entries.flatMap(({ source }) =>
        source.kind === 'repo' && source.repository === props.repository
          ? [source.folder]
          : [],
      ),
    );
    const skills = read.skills.map(({ name, skill }) => ({
      name: skill.name,
      description: skill.description,
      path: name,
      isKept: kept.has(`${props.folder}/${name}`),
    }));

    return skills.length === 0
      ? { isFound: false, reason: 'empty', said: '' }
      : { isFound: true, skills, commit: read.commit };
  }

  /** Traz para o QAzinho as skills escolhidas, desligadas até o QA ligar. */
  public async import(request: ISkillImport): Promise<ISkill[]> {
    const entries = await this.readIndex();
    const made: ISkillEntry[] = [];

    if (request.from === 'computer') {
      for (const path of request.paths) {
        const known = entries.find(
          ({ source }) => source.kind === 'computer' && source.path === path,
        );
        const id = known?.id ?? this.newId();

        await rm(this.dirOf(id), { recursive: true, force: true });
        await cp(path, this.dirOf(id), { recursive: true });
        made.push({
          id,
          use: known?.use ?? 'cases',
          projectIds: known?.projectIds ?? null,
          isOn: known?.isOn ?? false,
          source: { kind: 'computer', path },
          files: await this.filesIn(this.dirOf(id)),
          updatedAt: new Date(this.now()).toISOString(),
        });
      }
    } else {
      const read = await this.readRepo(request);

      if (read.isRead)
        for (const one of read.skills.filter(({ name }) =>
          request.names.includes(name),
        )) {
          const known = entries.find(
            ({ source }) =>
              source.kind === 'repo' &&
              source.repository === request.repository &&
              source.folder === `${request.folder}/${one.name}`,
          );
          const id = known?.id ?? this.newId();

          await this.writeRepoSkill({
            id,
            repository: request.repository,
            files: one.files,
          });
          made.push({
            id,
            use: known?.use ?? 'cases',
            projectIds: known?.projectIds ?? null,
            isOn: known?.isOn ?? false,
            source: {
              kind: 'repo',
              repository: request.repository,
              branch: request.branch,
              folder: `${request.folder}/${one.name}`,
              commit: read.commit,
            },
            files: one.files
              .map(({ path }) => path)
              .filter((path) => path !== SKILL_LIBRARY.skillFile),
            updatedAt: new Date(this.now()).toISOString(),
          });
        }
    }

    const ids = new Set(made.map(({ id }) => id));

    await this.writeIndex([...entries.filter(({ id }) => !ids.has(id)), ...made]);

    const skills = await Promise.all(made.map((entry) => this.skillOf(entry)));

    return skills.filter((skill): skill is ISkill => skill !== null);
  }

  /**
   * Relê as skills de um repositório cuja branch andou, e as deste computador, mantendo
   * onde valem e se estão ligadas.
   */
  public async refresh(): Promise<void> {
    const entries = await this.readIndex();
    const updated: ISkillEntry[] = [];

    for (const entry of entries) {
      const { source } = entry;

      if (source.kind === 'computer') {
        const isThere = await stat(source.path).then(
          () => true,
          () => false,
        );

        if (!isThere) continue;

        await rm(this.dirOf(entry.id), { recursive: true, force: true });
        await cp(source.path, this.dirOf(entry.id), { recursive: true });
        updated.push({ ...entry, files: await this.filesIn(this.dirOf(entry.id)) });
      } else if (source.kind === 'repo') {
        const head = await this.github.api({
          path: `repos/${source.repository}/commits/${refPath(source.branch)}`,
          jq: '.sha',
        });

        if (!head.isOk || head.text.trim() === source.commit) continue;

        const parent = source.folder.split('/').slice(0, -1).join('/');
        const name = source.folder.split('/').at(-1) ?? '';
        const read = await this.readRepo({
          repository: source.repository,
          branch: source.branch,
          folder: parent,
        });
        const one = read.isRead
          ? read.skills.find((skill) => skill.name === name)
          : undefined;

        if (!read.isRead || one === undefined) continue;

        await this.writeRepoSkill({
          id: entry.id,
          repository: source.repository,
          files: one.files,
        });
        updated.push({
          ...entry,
          source: { ...source, commit: read.commit },
          files: one.files
            .map(({ path }) => path)
            .filter((path) => path !== SKILL_LIBRARY.skillFile),
          updatedAt: new Date(this.now()).toISOString(),
        });
      }
    }

    if (updated.length === 0) return;

    const ids = new Set(updated.map(({ id }) => id));

    await this.writeIndex([...entries.filter(({ id }) => !ids.has(id)), ...updated]);
  }

  /** Copia uma skill para uma pasta que o QA escolheu, numa pasta com o nome dela. */
  public async export(props: { id: string; dir: string }): Promise<string | null> {
    const skill = (await this.list()).find(({ id }) => id === props.id);

    if (skill === undefined) return null;

    const target = join(props.dir, skill.name);

    await cp(this.dirOf(skill.id), target, { recursive: true });

    return target;
  }

  /** As skills que valem num chat ou numa exploração de um projeto, com as pastas. */
  public async forChat(props: {
    projectId: string;
    uses: SkillUse[];
    calledId: string | null;
  }): Promise<ITeamSkill[]> {
    return skillsForChat({
      skills: await this.list(),
      ...props,
      dirOf: (id) => this.dirOf(id),
    });
  }

  /** Copia os arquivos que o QA escolheu para o rascunho de uma skill. */
  public async attach(props: {
    draftId: string;
    paths: string[];
  }): Promise<ISkillDraftFile[]> {
    const dir = this.draftDir(props.draftId);
    const kept = await this.filesIn(dir);
    const room = Math.max(0, SKILL_LIBRARY.filesMax - kept.length);

    await mkdir(dir, { recursive: true });

    for (const path of props.paths.slice(0, room)) {
      const size = await stat(path).then(
        ({ size: bytes }) => bytes,
        () => Infinity,
      );

      if (size <= SKILL_LIBRARY.draftFileMax) await cp(path, join(dir, basename(path)));
    }

    return (await this.filesIn(dir)).map((name) => ({
      name,
      isImage: (SKILL_LIBRARY.imageExtensions as readonly string[]).includes(
        extname(name).toLowerCase(),
      ),
    }));
  }

  /** A pasta dos arquivos de um rascunho, que quem escreve a skill lê. */
  public draftDir(draftId: string): string {
    return join(this.root, SKILL_LIBRARY.draftsDir, draftId.replace(/[^\w-]/g, ''));
  }

  /** Apaga um rascunho que o QA deixou de lado. */
  public async dropDraft(draftId: string): Promise<void> {
    await rm(this.draftDir(draftId), { recursive: true, force: true });
  }

  private dirOf(id: string): string {
    return join(this.root, id.replace(/[^\w-]/g, ''));
  }

  private async skillOf(entry: ISkillEntry): Promise<ISkill | null> {
    const text = await readFile(
      join(this.dirOf(entry.id), SKILL_LIBRARY.skillFile),
      'utf8',
    ).catch(() => null);
    const read = text === null ? null : skillOfMarkdown({ text, fallbackName: entry.id });

    return read === null ? null : { ...entry, ...read };
  }

  private async readIndex(): Promise<ISkillEntry[]> {
    const text = await readFile(join(this.root, SKILL_LIBRARY.indexFile), 'utf8').catch(
      () => null,
    );

    if (text === null) return [];

    try {
      const read = JSON.parse(text) as { skills?: unknown };

      return Array.isArray(read.skills) ? (read.skills as ISkillEntry[]) : [];
    } catch {
      return [];
    }
  }

  private async writeIndex(entries: ISkillEntry[]): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await writeFile(
      join(this.root, SKILL_LIBRARY.indexFile),
      JSON.stringify({ skills: entries }, null, 2),
    );
  }

  private async filesIn(dir: string): Promise<string[]> {
    const names = await readdir(dir).catch(() => [] as string[]);

    return names.filter(
      (name) => name !== SKILL_LIBRARY.skillFile && !name.startsWith('.'),
    );
  }

  private async keepDraft(props: { draftId: string; dir: string }): Promise<string[]> {
    const from = this.draftDir(props.draftId);
    const names = await this.filesIn(from);

    for (const name of names) await cp(join(from, name), join(props.dir, name));

    await this.dropDraft(props.draftId);

    return names;
  }

  private async readRepo(props: {
    repository: string;
    branch: string;
    folder: string;
  }): Promise<
    | {
        isRead: true;
        commit: string;
        skills: {
          name: string;
          skill: { name: string; description: string; body: string };
          files: { path: string; content: Buffer }[];
        }[];
      }
    | { isRead: false; reason: 'no-cli' | 'refused'; said: string }
  > {
    const base = `repos/${props.repository}`;
    const head = await this.github.api({
      path: `${base}/commits/${refPath(props.branch)}`,
      jq: '.sha',
    });

    if (!head.isOk)
      return {
        isRead: false,
        reason: head.failure === 'no-cli' ? 'no-cli' : 'refused',
        said: head.said,
      };

    const commit = head.text.trim();
    const tree = await this.github.api({
      path: `${base}/git/trees/${commit}?recursive=1`,
    });

    if (!tree.isOk) return { isRead: false, reason: 'refused', said: tree.said };

    const found = repoSkillFilesOf({
      tree: this.parsed(tree.text),
      folder: props.folder,
    });
    const skills = await Promise.all(
      found.map(async ({ name, files }) => {
        const texts = await Promise.all(
          files.slice(0, SKILL_LIBRARY.filesMax + 1).map(async (file) => {
            const blob = await this.github.api({
              path: `${base}/git/blobs/${file.sha}`,
              jq: '.content',
            });

            return blob.isOk
              ? [
                  {
                    path: file.path,
                    content: Buffer.from(blob.text.replace(/\s/g, ''), 'base64'),
                  },
                ]
              : [];
          }),
        );
        const kept = texts.flat();
        const markdown = kept.find(({ path }) => path === SKILL_LIBRARY.skillFile);
        const skill =
          markdown === undefined
            ? null
            : skillOfMarkdown({
                text: markdown.content.toString('utf8'),
                fallbackName: name,
              });

        return skill === null ? [] : [{ name, skill, files: kept }];
      }),
    );

    return { isRead: true, commit, skills: skills.flat() };
  }

  private async writeRepoSkill(props: {
    id: string;
    repository: string;
    files: { path: string; content: Buffer }[];
  }): Promise<void> {
    const dir = this.dirOf(props.id);

    await rm(dir, { recursive: true, force: true });

    for (const file of props.files) {
      const target = join(dir, ...file.path.split('/'));

      await mkdir(join(target, '..'), { recursive: true });
      await writeFile(target, file.content);
    }
  }

  private parsed(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
