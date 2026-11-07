import { describe, expect, it } from 'vitest';
import { attachmentKindOf } from '@/main/classes/storage/ChatAttachments/library';

describe('attachmentKindOf', () => {
  it('takes a photo the agent can see as an image, whatever the case', () => {
    for (const name of ['shot.png', 'Tela.JPG', 'a.jpeg', 'b.gif', 'c.webp'])
      expect(attachmentKindOf(name)).toBe('image');
  });

  it('takes a document, or an image the agent cannot read, as a file', () => {
    for (const name of ['proposta.pdf', 'spec.docx', 'scan.heic', 'png', 'notes'])
      expect(attachmentKindOf(name)).toBe('file');
  });
});
