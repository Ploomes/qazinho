export interface IVariableEditorProps {
  name: string;
  description: string;
  value: string;
  valuePlaceholder: string;
  problem: string;
  canFinish: boolean;
  doneLabel: string;
  cancelLabel: string;
  onName: (name: string) => void;
  onDescription: (description: string) => void;
  onValue: (value: string) => void;
  onDone: () => void;
  onCancel: () => void;
}
