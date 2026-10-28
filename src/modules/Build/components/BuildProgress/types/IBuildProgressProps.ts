/**
 * Um build para acompanhar, e o que fazer quando o QA quer tentar de novo depois de
 * falhar ou parar, quando dá para tentar de novo lá.
 */
export interface IBuildProgressProps {
  buildId: string;
  onRetry?: () => void;
}
