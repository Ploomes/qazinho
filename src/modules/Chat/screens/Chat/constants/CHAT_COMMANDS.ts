import type { ChatCommandId } from '@/modules/Chat/types';
import type { ParseKeys } from 'i18next';

export const CHAT_COMMANDS: {
  id: ChatCommandId;
  slug: string;
  labelKey: ParseKeys;
  textKey: ParseKeys;
  aliases: string;
}[] = [
  {
    id: 'code-plan',
    slug: '/code',
    labelKey: 'COMMANDS.CODE_PLAN',
    textKey: 'COMMANDS.CODE_PLAN_TEXT',
    aliases: 'code codigo plan plano repo repositorio branch',
  },
  {
    id: 'jira-plan',
    slug: '/jira',
    labelKey: 'COMMANDS.JIRA_PLAN',
    textKey: 'COMMANDS.JIRA_PLAN_TEXT',
    aliases: 'jira story historia issue ticket requisito requirement criterio aceite',
  },
  {
    id: 'confluence-plan',
    slug: '/confluence',
    labelKey: 'COMMANDS.CONFLUENCE_PLAN',
    textKey: 'COMMANDS.CONFLUENCE_PLAN_TEXT',
    aliases: 'confluence page pagina doc documento wiki cenarios scenarios casos cases',
  },
  {
    id: 'figma-plan',
    slug: '/figma',
    labelKey: 'COMMANDS.FIGMA_PLAN',
    textKey: 'COMMANDS.FIGMA_PLAN_TEXT',
    aliases: 'figma design prototipo prototype layout frame tela screen ux ui',
  },
];
