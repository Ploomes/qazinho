import type { IMemoryNoteProps } from '@/modules/Chat/screens/Chat/components/MemoryNote/types';
import { useTranslation } from 'react-i18next';
import { MEMORY_LINE_KEYS } from '@/modules/Chat/screens/Chat/components/MemoryNote/constants';

export const useMemoryNoteViewModel = ({ message }: IMemoryNoteProps) => {
  const { t } = useTranslation();

  return {
    lines: message.changes.map(({ kind, text }, index) => ({
      key: `${kind}-${String(index)}`,
      text: t(MEMORY_LINE_KEYS[kind], { text }),
    })),
  };
};
