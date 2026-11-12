import { join } from 'node:path';
import { SKILL_LIBRARY } from '@/main/classes/skills/SkillLibrary/constants';

/**
 * As pastas pessoais em que o Claude Code e o Codex guardam skills neste computador, as
 * mesmas no Windows, no Linux e no macOS a partir da pasta do usuário.
 */
export function computerSkillDirs(home: string): string[] {
  return SKILL_LIBRARY.folders.map((folder) => join(home, ...folder.split('/')));
}
