export interface IComposerProps {
  value: string;
  targetLabel: string;
  agentLabel: string;
  onChange: (value: string) => void;
  onSend: () => void;
}
