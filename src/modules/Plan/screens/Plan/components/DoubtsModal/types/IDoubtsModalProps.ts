import type { IPlanDoubt } from '@/shared/types';

/**
 * As dúvidas ainda não mandadas, prestes a ir à história num comentário, e o que fazer
 * depois de postado.
 */
export interface IDoubtsModalProps {
  storyKey: string;
  doubts: IPlanDoubt[];
  onCancel: () => void;
  onPosted: (props: {
    sent: { url: string; at: string };
    questions: { id: string; question: string }[];
  }) => void;
}
