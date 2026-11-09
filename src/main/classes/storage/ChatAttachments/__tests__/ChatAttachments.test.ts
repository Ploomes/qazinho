import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ChatAttachments } from '@/main/classes/storage/ChatAttachments';
import { CHAT_ATTACHMENTS } from '@/shared/constants';

/** Uma miniatura falsa, para o teste não precisar do Electron. */
async function attachmentsIn() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-attachments-'));
  const outside = await mkdtemp(join(tmpdir(), 'qazinho-picked-'));

  return {
    root,
    outside,
    attachments: new ChatAttachments({
      root,
      previewOf: () => 'data:image/jpeg;base64,x',
    }),
  };
}

describe('ChatAttachments', () => {
  it('copies the files the QA picked into the workspace folder, an image with a preview', async () => {
    const { root, outside, attachments } = await attachmentsIn();
    const shot = join(outside, 'erro.png');
    const pdf = join(outside, 'proposta.pdf');

    await writeFile(shot, 'png');
    await writeFile(pdf, '%PDF');

    const added = await attachments.addFiles({ workspaceId: 'w1', paths: [shot, pdf] });

    expect(added).toMatchObject({
      isAttached: true,
      attachments: [
        { name: 'erro.png', kind: 'image', size: 3, preview: 'data:image/jpeg;base64,x' },
        { name: 'proposta.pdf', kind: 'file', size: 4, preview: null },
      ],
    });
    expect((await readdir(join(root, 'w1'))).sort()).toHaveLength(2);
  });

  it('keeps what the QA pasted, and hands it to the agent by path', async () => {
    const { root, attachments } = await attachmentsIn();
    const added = await attachments.addData({
      workspaceId: 'w1',
      name: 'paste.png',
      data: new Uint8Array([1, 2, 3]),
    });

    if (!added.isAttached) throw new Error('not attached');

    const files = await attachments.filesOf({
      workspaceId: 'w1',
      attachments: added.attachments,
    });

    expect(files?.root).toBe(join(root, 'w1'));
    expect(files?.files).toEqual([
      {
        name: 'paste.png',
        path: join(root, 'w1', added.attachments[0]?.file ?? ''),
        isImage: true,
      },
    ]);
    expect([...(await readFile(files?.files[0]?.path ?? ''))]).toEqual([1, 2, 3]);
  });

  it('does NOT take a file over the limit, nor more files than a message carries', async () => {
    const { attachments } = await attachmentsIn();

    expect(
      await attachments.addData({
        workspaceId: 'w1',
        name: 'huge.mov',
        data: new Uint8Array(CHAT_ATTACHMENTS.maxBytes + 1),
      }),
    ).toEqual({ isAttached: false, failure: { reason: 'too-big', name: 'huge.mov' } });
    expect(
      await attachments.addFiles({
        workspaceId: 'w1',
        paths: Array.from({ length: CHAT_ATTACHMENTS.maxCount + 1 }, (_, index) =>
          String(index),
        ),
      }),
    ).toEqual({ isAttached: false, failure: { reason: 'too-many' } });
  });

  it('says which file it could not read', async () => {
    const { attachments } = await attachmentsIn();

    expect(
      await attachments.addFiles({ workspaceId: 'w1', paths: ['/no/such/file.pdf'] }),
    ).toEqual({ isAttached: false, failure: { reason: 'unreadable', name: 'file.pdf' } });
  });

  /** A página manda o nome do arquivo de volta; um nome que sobe pastas nunca é lido. */
  it('does NOT hand the agent a file outside the folder, nor one that is gone', async () => {
    const { attachments } = await attachmentsIn();

    expect(
      await attachments.filesOf({
        workspaceId: 'w1',
        attachments: [
          {
            id: 'a',
            name: 'x',
            file: '../../secret.txt',
            kind: 'file',
            size: 1,
            preview: null,
          },
          {
            id: 'b',
            name: 'y',
            file: 'b-gone.pdf',
            kind: 'file',
            size: 1,
            preview: null,
          },
        ],
      }),
    ).toBeNull();
    expect(
      await attachments.addData({
        workspaceId: '../w',
        name: 'a.png',
        data: new Uint8Array(1),
      }),
    ).toMatchObject({ isAttached: false });
  });

  it('forgets the files of a workspace that is gone', async () => {
    const { root, attachments } = await attachmentsIn();

    await attachments.addData({
      workspaceId: 'w1',
      name: 'a.txt',
      data: new Uint8Array(1),
    });
    await attachments.forget('w1');

    await expect(readdir(join(root, 'w1'))).rejects.toThrow();
  });

  describe('listOf', () => {
    it('lists what a workspace holds, under the names the QA gave', async () => {
      const { attachments, root } = await attachmentsIn();
      const added = await attachments.addData({
        workspaceId: 'w1',
        name: 'nota.pdf',
        data: new Uint8Array([1]),
      });

      expect(added.isAttached).toBe(true);

      const listed = await attachments.listOf('w1');

      expect(listed.map(({ name }) => name)).toEqual(['nota.pdf']);
      expect(listed[0]?.path.startsWith(join(root, 'w1'))).toBe(true);
    });

    it('lists nothing for a workspace that holds nothing, or a name that leaves the folder', async () => {
      const { attachments } = await attachmentsIn();

      expect(await attachments.listOf('w2')).toEqual([]);
      expect(await attachments.listOf('../w1')).toEqual([]);
    });

    it('stops at the newest ones', async () => {
      const { attachments } = await attachmentsIn();

      for (let index = 0; index <= CHAT_ATTACHMENTS.listedForRun; index += 1)
        await attachments.addData({
          workspaceId: 'w1',
          name: `f${String(index)}.txt`,
          data: new Uint8Array([1]),
        });

      expect(await attachments.listOf('w1')).toHaveLength(CHAT_ATTACHMENTS.listedForRun);
    });
  });
});
