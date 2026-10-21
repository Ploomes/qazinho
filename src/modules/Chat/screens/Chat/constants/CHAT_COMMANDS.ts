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
];
