export interface IComposerProps {
  value: string;
  agentLabel: string;
  onChange: (value: string) => void;
  onSend: () => void;
}
