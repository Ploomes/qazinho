import { describe, expect, it } from 'vitest';
import { fileNameOf } from '@/main/classes/integrations/JiraStories/library';

describe('fileNameOf', () => {
  it('keeps the name Jira gave a file', () => {
    expect(fileNameOf({ filename: 'Tela do checkout (v2).png', taken: [] })).toBe(
      'Tela do checkout (v2).png',
    );
  });

  /** A name is written into a folder of QAzinho's own: it must not climb out of it. */
  it('does NOT let a name reach another folder, nor hide itself', () => {
    expect(fileNameOf({ filename: '../../.ssh/id_rsa', taken: [] })).toBe('id_rsa');
    expect(fileNameOf({ filename: '..\\..\\boot.ini', taken: [] })).toBe('boot.ini');
    expect(fileNameOf({ filename: '.env', taken: [] })).toBe('env');
    expect(fileNameOf({ filename: '', taken: [] })).toBe('file');
  });

  it('numbers a name another file already took', () => {
    expect(fileNameOf({ filename: 'a.png', taken: ['a.png', 'a (2).png'] })).toBe(
      'a (3).png',
    );
    expect(fileNameOf({ filename: 'notes', taken: ['notes'] })).toBe('notes (2)');
  });
});
