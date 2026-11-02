import type { KeyboardEvent, RefObject } from 'react';

/**
 * A pergunta que a ilha mostra e como responder: as setas quando há outras, as opções,
 * o campo, ou o aviso de que um segredo se digita no app.
 */
export interface IIslandAskProps {
  title: string;
  line: string;
  question: string;
  position: string | null;
  previousLabel: string;
  nextLabel: string;
  hasOptions: boolean;
  options: { label: string; onPick: () => void }[];
  canType: boolean;
  draft: string;
  fieldLabel: string;
  fieldRef: RefObject<HTMLInputElement | null>;
  canSend: boolean;
  sendLabel: string;
  secretNote: string | null;
  openLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onDraft: (text: string) => void;
  onFieldPress: () => void;
  onFieldBlur: () => void;
  onFieldKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onOpen: () => void;
}
