import type { StoryReadiness } from '@/shared/types';

/**
 * Se uma história já chegou para teste pelos status que o projeto diz que contam, ou null
 * quando o projeto não disse nenhum.
 */
export function readinessOf(props: {
  status: string;
  ready: string[];
}): StoryReadiness | null {
  if (props.ready.length === 0) return null;

  const status = props.status.trim().toLowerCase();

  return props.ready.some((name) => name.trim().toLowerCase() === status)
    ? 'ready'
    : 'ahead';
}
