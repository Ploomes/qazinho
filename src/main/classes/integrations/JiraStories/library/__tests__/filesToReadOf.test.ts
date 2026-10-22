import { describe, expect, it } from 'vitest';
import { JIRA_FILES } from '@/main/classes/integrations/JiraStories/constants';
import { filesToReadOf } from '@/main/classes/integrations/JiraStories/library';

const file = (filename: string, kind: { mimeType: string; size?: number }) => ({
  id: filename,
  filename,
  mimeType: kind.mimeType,
  size: kind.size ?? 1_000,
});

describe('filesToReadOf', () => {
  it('reads pictures, PDFs and text, and says why it leaves the rest', () => {
    expect(
      filesToReadOf([
        file('tela.png', { mimeType: 'image/png' }),
        file('regras.pdf', { mimeType: 'application/pdf' }),
        file('notas.txt', { mimeType: 'text/plain' }),
        file('demo.mp4', { mimeType: 'video/mp4' }),
        file('planilha.xlsx', { mimeType: 'application/vnd.ms-excel' }),
      ]).map(({ filename, note }) => `${filename} ${note}`),
    ).toEqual([
      'tela.png read',
      'regras.pdf read',
      'notas.txt read',
      'demo.mp4 not-readable',
      'planilha.xlsx not-readable',
    ]);
  });

  it('does NOT read a file too large alone, nor one past what all of them may weigh', () => {
    const big = JIRA_FILES.maxFileBytes;

    expect(
      filesToReadOf([
        file('one.png', { mimeType: 'image/png', size: big + 1 }),
        file('a.png', { mimeType: 'image/png', size: big }),
        file('b.png', { mimeType: 'image/png', size: big }),
        file('c.png', { mimeType: 'image/png', size: big }),
        file('d.png', { mimeType: 'image/png', size: 10 }),
      ]).map(({ note }) => note),
    ).toEqual(['too-large', 'read', 'read', 'read', 'too-large']);
  });

  it(`reads ${String(JIRA_FILES.maxFiles)} files at most`, () => {
    const many = Array.from({ length: JIRA_FILES.maxFiles + 2 }, (_, index) =>
      file(`${String(index)}.png`, { mimeType: 'image/png' }),
    );

    expect(filesToReadOf(many).filter(({ note }) => note === 'too-many')).toHaveLength(2);
  });
});
