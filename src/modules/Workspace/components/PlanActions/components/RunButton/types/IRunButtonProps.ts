/**
 * O botão que leva o plano à etapa seguinte, continua a run que o app fechou no meio, ou
 * espera a história chegar para teste, abrindo para os outros jeitos.
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
  waitsFor?: string | null;
  onExplore?: () => void;
}
