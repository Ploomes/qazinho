import { describe, expect, it } from 'vitest';
import {
  markdownOfSkill,
  skillOfMarkdown,
} from '@/main/classes/skills/SkillLibrary/library';

describe('markdownOfSkill', () => {
  it('writes a SKILL.md that reads back the same, quotes included', () => {
    const skill = {
      name: 'cases-gherkin',
      description: 'When writing: "cases" from a story',
      body: '## Format\nGiven, When, Then.',
    };
    const text = markdownOfSkill(skill);

    expect(text.startsWith('---\nname: cases-gherkin\n')).toBe(true);
    expect(skillOfMarkdown({ text, fallbackName: 'x' })).toEqual(skill);
  });
});
