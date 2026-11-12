export const SKILL_LIBRARY = {
  indexFile: 'skills.json',
  skillFile: 'SKILL.md',
  draftsDir: '.drafts',
  nameMax: 64,
  descriptionMax: 1_024,
  bodyMax: 64_000,
  fileMax: 1_000_000,
  draftFileMax: 20_000_000,
  imageExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  filesMax: 20,
  skillsMax: 30,
  folders: ['.claude/skills', '.agents/skills'],
} as const;
