/**
 * O botão que leva o plano à etapa seguinte, ou continua a run que o app fechou no meio,
 * abrindo para os outros jeitos quando há mais de um.
 */
export interface IRunButtonProps {
  canRun: boolean;
  canChoose: boolean;
  developed: number;
  toDevelop: number;
  toContinue: number;
  onRun: () => void;
  onRunPlan: () => void;
  onRunDeveloped: () => void;
  onRunWithAgent: () => void;
  canExplore?: boolean;
  onExplore?: () => void;
}
