import { describe, expect, it } from 'vitest';
import { skillOfMarkdown } from '@/main/classes/skills/SkillLibrary/library';

describe('skillOfMarkdown', () => {
  it('reads the name, when to use it and the instructions of a SKILL.md', () => {
    expect(
      skillOfMarkdown({
        text: '---\nname: cases-gherkin\ndescription: When writing cases\n---\n\n## Format\nGherkin.\n',
        fallbackName: 'folder',
      }),
    ).toEqual({
      name: 'cases-gherkin',
      description: 'When writing cases',
      body: '## Format\nGherkin.',
    });
  });

  it('reads a Windows file the same way', () => {
    expect(
      skillOfMarkdown({
        text: '---\r\nname: x\r\ndescription: y\r\n---\r\nBody\r\n',
        fallbackName: 'z',
      })?.body,
    ).toBe('Body');
  });

  it('names a plain Markdown file after its folder, and takes its first line as when to use it', () => {
    expect(
      skillOfMarkdown({
        text: '# Edge cases\nA limit for every field.',
        fallbackName: 'Bordas',
      }),
    ).toEqual({
      name: 'bordas',
      description: 'Edge cases',
      body: '# Edge cases\nA limit for every field.',
    });
  });

  it('does NOT read a file with no instructions, nor trust a broken frontmatter', () => {
    expect(
      skillOfMarkdown({ text: '---\nname: x\n---\n', fallbackName: 'x' }),
    ).toBeNull();
    expect(
      skillOfMarkdown({ text: '---\nname: [\n---\nBody', fallbackName: 'Fallback' })
        ?.name,
    ).toBe('fallback');
  });
});
