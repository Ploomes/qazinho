import { describe, expect, it } from 'vitest';
import { repoSkillFilesOf } from '@/main/classes/skills/SkillLibrary/library';

const blob = (path: string, size = 10) => ({
  path,
  type: 'blob',
  sha: `sha-${path}`,
  size,
});

describe('repoSkillFilesOf', () => {
  it('finds each folder with a SKILL.md under the folder, with its files', () => {
    expect(
      repoSkillFilesOf({
        folder: '.claude/skills/',
        tree: {
          tree: [
            blob('.claude/skills/cases/SKILL.md'),
            blob('.claude/skills/cases/template.md'),
            blob('.claude/skills/notes.md'),
            blob('.claude/skills/empty/README.md'),
            blob('tests/login.spec.ts'),
            { path: '.claude/skills/cases', type: 'tree', sha: 't1' },
          ],
        },
      }),
    ).toEqual([
      {
        name: 'cases',
        files: [
          { path: 'SKILL.md', sha: 'sha-.claude/skills/cases/SKILL.md' },
          { path: 'template.md', sha: 'sha-.claude/skills/cases/template.md' },
        ],
      },
    ]);
  });

  it('leaves out a file too large to keep, and reads nothing from a broken answer', () => {
    expect(
      repoSkillFilesOf({
        folder: 'skills',
        tree: {
          tree: [blob('skills/a/SKILL.md'), blob('skills/a/video.mp4', 50_000_000)],
        },
      })[0]?.files,
    ).toEqual([{ path: 'SKILL.md', sha: 'sha-skills/a/SKILL.md' }]);
    expect(repoSkillFilesOf({ folder: 'skills', tree: 'nope' })).toEqual([]);
  });
});
