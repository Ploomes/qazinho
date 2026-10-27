import type { ICodeCommand } from './ICodeCommand';
import type { IConfluenceCommand } from './IConfluenceCommand';
import type { IFigmaCommand } from './IFigmaCommand';
import type { IJiraCommand } from './IJiraCommand';

/**
 * A command the QA sent: a plan from the code, from a Jira story or a Confluence page, or
 * against a Figma design.
 */
export type UserCommand =
  ICodeCommand | IJiraCommand | IConfluenceCommand | IFigmaCommand;
