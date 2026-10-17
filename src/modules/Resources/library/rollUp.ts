import type { IProcessSample } from '@/shared/types';

const MB_IN_GB = 1024;

/** A browser is a dozen processes. The QA reads one line, so they are added up first. */
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
