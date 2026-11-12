import { SKILL_LIBRARY } from '@/main/classes/skills/SkillLibrary/constants';

/**
 * Um nome de skill como o padrão pede: minúsculas sem acento, números e hífens, sem hífen
 * nas pontas; vazio quando não sobra nada.
 */
export function skillNameOf(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SKILL_LIBRARY.nameMax)
    .replace(/-+$/g, '');
}
