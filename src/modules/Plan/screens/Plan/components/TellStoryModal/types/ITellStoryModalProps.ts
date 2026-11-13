/** O comentário que conta à história o que o plano decidiu, pronto para o QA editar. */
export interface ITellStoryModalProps {
  storyKey: string;
  note: string;
  onCancel: () => void;
  onPosted: (url: string) => void;
}
