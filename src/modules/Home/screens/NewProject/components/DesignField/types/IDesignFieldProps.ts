import type { IDesignLink } from '@/shared/types';

/** O design do Figma que o QA colou, ou nenhum ainda. */
export interface IDesignFieldProps {
  value: IDesignLink | null;
  onChange: (value: IDesignLink | null) => void;
}
