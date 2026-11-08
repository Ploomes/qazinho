/**
 * O botão que leva o plano à etapa seguinte: desenvolver o que falta, ou rodar o que já
 * está desenvolvido, abrindo para os outros jeitos quando há gravação.
 */
export interface IRunButtonProps {
  canRun: boolean;
  canChoose: boolean;
  developed: number;
  toDevelop: number;
  onRun: () => void;
  onRunDeveloped: () => void;
  onRunWithAgent: () => void;
}
