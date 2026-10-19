export interface IUndoToastProps {
  text: string;
  actionLabel: string;
  onUndo: () => void;
  onExpire: () => void;
}
