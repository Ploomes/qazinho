/**
 * O botão que roda o plano de um workspace, abrindo para o outro jeito de rodá-lo quando
 * um caso passou.
 */
export interface IRunButtonProps {
  canRun: boolean;
  canChoose: boolean;
  onRun: () => void;
  onRunWithAgent: () => void;
}
