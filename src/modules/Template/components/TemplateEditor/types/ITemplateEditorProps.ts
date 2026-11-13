import type { ITemplate } from '@/shared/types';

/**
 * O modelo aberto para editar, ou nenhum para criar um, a org dele quando é de uma, e o
 * que fazer ao fechar.
 */
export interface ITemplateEditorProps {
  editing: ITemplate | null;
  orgSlug: string | null;
  onClose: () => void;
}
