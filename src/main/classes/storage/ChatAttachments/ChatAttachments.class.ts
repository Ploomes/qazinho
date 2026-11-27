import type { IChatAttachments } from './types';
import type { AttachOutcome, IChatAttachment } from '@/shared/types';
import type { IAttachedFiles } from '@ploomes/qazinho-harness';
import { randomUUID } from 'node:crypto';
import { access, copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { CHAT_ATTACHMENTS } from '@/shared/constants';
import { attachedNameOf, attachmentKindOf, isStoredName, storedNameOf } from './library';

/**
 * Guarda os arquivos que o QA anexa ao chat, numa pasta por workspace que o agente lê, e
 * os acha de volta só por dentro dela.
 */
export class ChatAttachments {
  private readonly root: string;
  private readonly previewOf: (file: string) => string | null;

  public constructor(props: IChatAttachments) {
    this.root = props.root;
    this.previewOf = props.previewOf;
  }

  /** Copia para a pasta do workspace os arquivos que o QA escolheu no disco. */
  public async addFiles(props: {
    workspaceId: string;
    paths: string[];
  }): Promise<AttachOutcome> {
    if (props.paths.length > CHAT_ATTACHMENTS.maxCount)
      return { isAttached: false, failure: { reason: 'too-many' } };

    const sizes = await Promise.all(
      props.paths.map((path) =>
        stat(path).then(
          (found) => (found.isFile() ? found.size : null),
          () => null,
        ),
      ),
    );

    for (const [index, path] of props.paths.entries()) {
      const size = sizes[index] ?? null;
      const name = basename(path);

      if (size === null)
        return { isAttached: false, failure: { reason: 'unreadable', name } };

      if (size > CHAT_ATTACHMENTS.maxBytes)
        return { isAttached: false, failure: { reason: 'too-big', name } };
    }

    const folder = await this.folderOf(props.workspaceId);

    if (folder === null)
      return { isAttached: false, failure: { reason: 'unreadable', name: '' } };

    const attachments: IChatAttachment[] = [];

    for (const [index, path] of props.paths.entries()) {
      const name = basename(path);
      const id = randomUUID().slice(0, 8);
      const file = storedNameOf({ id, name });

      await copyFile(path, join(folder, file));
      attachments.push(
        this.describe({ id, name, file, folder, size: sizes[index] ?? 0 }),
      );
    }

    return { isAttached: true, attachments };
  }

  /** Guarda na pasta do workspace um arquivo que o QA colou ou soltou no chat. */
  public async addData(props: {
    workspaceId: string;
    name: string;
    data: Uint8Array;
  }): Promise<AttachOutcome> {
    if (props.data.byteLength > CHAT_ATTACHMENTS.maxBytes)
      return { isAttached: false, failure: { reason: 'too-big', name: props.name } };

    const folder = await this.folderOf(props.workspaceId);

    if (folder === null)
      return { isAttached: false, failure: { reason: 'unreadable', name: props.name } };

    const id = randomUUID().slice(0, 8);
    const file = storedNameOf({ id, name: props.name });

    await writeFile(join(folder, file), props.data);

    return {
      isAttached: true,
      attachments: [
        this.describe({
          id,
          name: props.name,
          file,
          folder,
          size: props.data.byteLength,
        }),
      ],
    };
  }

  /** Os anexos de uma mensagem como o agente os lê: só os que existem dentro da pasta. */
  public async filesOf(props: {
    workspaceId: string;
    attachments: IChatAttachment[];
  }): Promise<IAttachedFiles | null> {
    if (props.attachments.length === 0 || !isStoredName(props.workspaceId)) return null;

    const root = join(this.root, props.workspaceId);
    const kept = await Promise.all(
      props.attachments.map(async ({ name, file, kind }) => {
        if (!isStoredName(file)) return null;

        const path = join(root, file);

        return access(path).then(
          () => ({ name, path, isImage: kind === 'image' }),
          () => null,
        );
      }),
    );
    const files = kept.filter((one) => one !== null);

    return files.length === 0 ? null : { root, files };
  }

  /** Os anexos de um workspace, do mais novo ao mais velho, pelo nome real. */
  public async listOf(workspaceId: string): Promise<{ name: string; path: string }[]> {
    if (!isStoredName(workspaceId)) return [];

    const root = join(this.root, workspaceId);
    const found = await readdir(root, { withFileTypes: true }).catch(() => []);
    const dated = await Promise.all(
      found
        .filter((entry) => entry.isFile())
        .map(async ({ name }) => ({
          name,
          at: (await stat(join(root, name))).mtimeMs,
        })),
    );

    return dated
      .sort((one, other) => other.at - one.at)
      .slice(0, CHAT_ATTACHMENTS.listedForRun)
      .map(({ name }) => ({ name: attachedNameOf(name), path: join(root, name) }));
  }

  /** Apaga os anexos de um workspace que se foi. */
  public async forget(workspaceId: string): Promise<void> {
    if (!isStoredName(workspaceId)) return;

    await rm(join(this.root, workspaceId), { recursive: true, force: true });
  }

  private async folderOf(workspaceId: string): Promise<string | null> {
    if (!isStoredName(workspaceId)) return null;

    const folder = join(this.root, workspaceId);

    await mkdir(folder, { recursive: true });

    return folder;
  }

  private describe(props: {
    id: string;
    name: string;
    file: string;
    folder: string;
    size: number;
  }): IChatAttachment {
    const kind = attachmentKindOf(props.name);

    return {
      id: props.id,
      name: props.name,
      file: props.file,
      kind,
      size: props.size,
      preview: kind === 'image' ? this.previewOf(join(props.folder, props.file)) : null,
    };
  }
}
