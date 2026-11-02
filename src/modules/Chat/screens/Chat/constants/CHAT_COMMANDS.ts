import type { ChatCommandId } from '@/modules/Chat/types';
import type { ParseKeys } from 'i18next';

export const CHAT_COMMANDS: {
  id: ChatCommandId;
  slug: string;
  labelKey: ParseKeys;
  aliases: string;
}[] = [
  {
    id: 'code-plan',
    slug: '/code',
    labelKey: 'COMMANDS.CODE_PLAN',
    aliases: 'code codigo plan plano repo repositorio branch',
  },
  {
    id: 'jira-plan',
    slug: '/jira',
    labelKey: 'COMMANDS.JIRA_PLAN',
    aliases: 'jira story historia issue ticket requisito requirement criterio aceite',
  },
  {
    id: 'confluence-plan',
    slug: '/confluence',
    labelKey: 'COMMANDS.CONFLUENCE_PLAN',
    aliases: 'confluence page pagina doc documento wiki cenarios scenarios casos cases',
  },
  {
    id: 'figma-plan',
    slug: '/figma',
    labelKey: 'COMMANDS.FIGMA_PLAN',
    aliases: 'figma design prototipo prototype layout frame tela screen ux ui',
  },
  {
    id: 'import-plan',
    slug: '/import',
    labelKey: 'COMMANDS.IMPORT_PLAN',
    aliases:
      'import importar testes tests playwright maestro cypress detox appium selenium pasta folder suite',
  },
];
