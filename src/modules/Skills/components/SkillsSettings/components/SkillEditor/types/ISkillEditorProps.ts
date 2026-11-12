import type { IProject } from '@/modules/Project/types';
import type { ISkillEditing } from '@/modules/Skills/components/SkillsSettings/types';

export interface ISkillEditorProps {
  editing: ISkillEditing;
  projects: IProject[];
  onClose: () => void;
}
