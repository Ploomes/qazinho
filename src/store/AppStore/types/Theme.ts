import type { ShownTheme } from './ShownTheme';

/** O tema que o QA escolheu: um dos dois, ou o do sistema, que segue o computador. */
export type Theme = ShownTheme | 'system';
