import type { ICodeCommand } from './ICodeCommand';
import type { IConfluenceCommand } from './IConfluenceCommand';
import type { IFigmaCommand } from './IFigmaCommand';
import type { IImportCommand } from './IImportCommand';
import type { IJiraCommand } from './IJiraCommand';

/**
 * Um comando que o QA mandou: um plano a partir do código, de uma história do Jira, de
 * uma página do Confluence ou de testes que ele já tem, ou contra um design do Figma.
 */
export type UserCommand =
  ICodeCommand | IJiraCommand | IConfluenceCommand | IFigmaCommand | IImportCommand;
