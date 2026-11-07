import { describe, expect, it } from 'vitest';
import { storedNameOf } from '@/main/classes/storage/ChatAttachments/library';

describe('storedNameOf', () => {
  it('puts the id before the name, keeping the extension', () => {
    expect(storedNameOf({ id: 'a1', name: 'proposta brazilcoa.pdf' })).toBe(
      'a1-proposta brazilcoa.pdf',
    );
  });

  it('never leaves the folder, on any system', () => {
    for (const name of ['../../etc/passwd', 'C:\\Users\\qa\\x.png', 'a/b.png', '..'])
      expect(storedNameOf({ id: 'a1', name })).not.toMatch(/[\\/]|^a1-\.\./);
  });

  it('cuts a long name and keeps its extension', () => {
    const stored = storedNameOf({ id: 'a1', name: `${'x'.repeat(300)}.png` });

    expect(stored.endsWith('.png')).toBe(true);
    expect(stored.length).toBeLessThan(140);
  });

  it('names a file with no name at all', () => {
    expect(storedNameOf({ id: 'a1', name: '' })).toBe('a1-file');
  });
});
