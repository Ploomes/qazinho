import type { ICodeCommand } from './ICodeCommand';
import type { IConfluenceCommand } from './IConfluenceCommand';
import type { IFigmaCommand } from './IFigmaCommand';
import type { IImportCommand } from './IImportCommand';
import type { IJiraCommand } from './IJiraCommand';
import type { ISkillCommand } from './ISkillCommand';

/**
 * Um comando que o QA mandou: um plano a partir do código, de uma história do Jira, de
 * uma página do Confluence ou de testes que ele já tem, contra um design, ou uma skill.
 */
export type UserCommand =
  | ICodeCommand
  | IJiraCommand
  | IConfluenceCommand
  | IFigmaCommand
  | IImportCommand
  | ISkillCommand;
