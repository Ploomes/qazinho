/** The button that runs a workspace's plan, opening onto the other way to run it once a case passed. */
export interface IRunButtonProps {
  canRun: boolean;
  canChoose: boolean;
  onRun: () => void;
  onRunWithAgent: () => void;
}
