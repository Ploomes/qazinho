import type { PlanSignalKind } from '@/app/components/Sidebar/types';

const URGENCY: PlanSignalKind[] = ['asking', 'running', 'paused', 'failed'];

/** O sinal de um projeto na barra recolhida: o mais urgente dos planos dele. */
export function projectSignalOf(kinds: (PlanSignalKind | null)[]): PlanSignalKind | null {
  return URGENCY.find((kind) => kinds.includes(kind)) ?? null;
}
