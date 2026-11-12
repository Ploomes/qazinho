import type { ISkillEditing } from '@/modules/Skills/components/SkillsSettings/types';

export interface ISkillCreatorProps {
  onClose: () => void;
  onWrite: () => void;
  onDrafted: (draft: NonNullable<ISkillEditing['draft']>) => void;
}
