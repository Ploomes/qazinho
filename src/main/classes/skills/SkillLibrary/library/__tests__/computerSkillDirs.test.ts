import { describe, expect, it } from 'vitest';
import { computerSkillDirs } from '@/main/classes/skills/SkillLibrary/library';

describe('computerSkillDirs', () => {
  it('looks where Claude Code and Codex keep the personal skills', () => {
    expect(computerSkillDirs('/Users/qa')).toEqual([
      '/Users/qa/.claude/skills',
      '/Users/qa/.agents/skills',
    ]);
  });
});
