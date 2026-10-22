import type { ICodeCommand } from './ICodeCommand';
import type { IJiraCommand } from './IJiraCommand';

/** A command the QA sent: a plan from the code, or from a Jira story. */
export type UserCommand = ICodeCommand | IJiraCommand;
