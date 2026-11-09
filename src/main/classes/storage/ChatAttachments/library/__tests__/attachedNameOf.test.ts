import { describe, expect, it } from 'vitest';
import { attachedNameOf } from '@/main/classes/storage/ChatAttachments/library';

describe('attachedNameOf', () => {
  it('takes off the id the file is kept under', () => {
    expect(attachedNameOf('ab12cd34-nota final.pdf')).toBe('nota final.pdf');
  });

  it('leaves a name that was not kept with an id', () => {
    expect(attachedNameOf('nota-2.pdf')).toBe('nota-2.pdf');
  });
});
