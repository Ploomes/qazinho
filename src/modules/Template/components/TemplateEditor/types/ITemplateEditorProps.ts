import type { ITemplate } from '@/shared/types';

/** O modelo aberto para editar, ou nenhum para criar um, e o que fazer ao fechar. */
export interface ITemplateEditorProps {
  editing: ITemplate | null;
  onClose: () => void;
}
