import type { IProcessSample } from '@/shared/types';

const MB_IN_GB = 1024;

/**
 * Um navegador são uma dúzia de processos. O QA lê uma linha, então eles são somados
 * antes.
 */
export function rollUp(samples: IProcessSample[]): {
  name: string;
  cpu: number;
  ramGb: number;
} {
  const ramMb = samples.reduce((total, one) => total + one.ramMb, 0);

  return {
    name: samples[0]?.name ?? '',
    cpu: Math.round(samples.reduce((total, one) => total + one.cpu, 0) * 10) / 10,
    ramGb: Math.round((ramMb / MB_IN_GB) * 100) / 100,
  };
}
