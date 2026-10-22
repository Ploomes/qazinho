import type { ICodeCommand } from './ICodeCommand';
import type { IFigmaCommand } from './IFigmaCommand';
import type { IJiraCommand } from './IJiraCommand';

/** A command the QA sent: a plan from the code, from a Jira story, or against a Figma design. */
export type UserCommand = ICodeCommand | IJiraCommand | IFigmaCommand;
