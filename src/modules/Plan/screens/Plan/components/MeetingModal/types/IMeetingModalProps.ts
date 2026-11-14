/** A transcrição de uma reunião que o QA traz para o plano, lida como uma mudança. */
export interface IMeetingModalProps {
  onCancel: () => void;
  onRead: (meeting: { name: string; text: string }) => void;
}
