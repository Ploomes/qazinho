import type { IUserMessageProps } from '@/modules/Chat/screens/Chat/components/UserMessage/types';
import { useTranslation } from 'react-i18next';
import { splitMentions } from '@/modules/Chat/library';
import { CHAT_COMMANDS } from '@/modules/Chat/screens/Chat/constants';

export const useUserMessageViewModel = (props: IUserMessageProps) => {
  const { text, mentions = [], command } = props.message;
  const { t } = useTranslation();
  const labelKey = CHAT_COMMANDS.find(({ id }) => id === command?.id)?.labelKey;

  return {
    hasText: text !== '',
    command:
      command === undefined || labelKey === undefined
        ? null
        : {
            name: t(labelKey),
            parts: (command.id === 'jira-plan'
              ? [
                  { text: command.key, isStrong: true },
                  { text: command.summary, isStrong: false },
                ]
              : command.id === 'figma-plan'
                ? [
                    { text: command.name, isStrong: true },
                    {
                      text:
                        command.nodeId === null
                          ? t('COMMANDS.DESIGN_WHOLE_FILE')
                          : t('COMMANDS.DESIGN_NODE', { node: command.nodeId }),
                      isStrong: false,
                    },
                  ]
                : [
                    { text: command.repository, isStrong: false },
                    { text: command.branch, isStrong: true },
                  ]
            ).map((part, index) => ({
              key: `${String(index)}-${part.text}`,
              text: part.text,
              className: part.isStrong
                ? 'user-message__command-part user-message__command-part--strong'
                : 'user-message__command-part',
            })),
          },
    parts: splitMentions({ text, ids: mentions }).map((part, index) => ({
      ...part,
      key: `${String(index)}-${part.text}`,
    })),
  };
};
