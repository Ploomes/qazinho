import type { IFindingNoteProps } from '@/modules/Chat/screens/Chat/components/FindingNote/types';

export const useFindingNoteViewModel = (props: IFindingNoteProps) => ({
  onOpen: () => {
    props.onOpenBug(props.message.bugId);
  },
});
