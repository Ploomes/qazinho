import type { ACTIVITY_KEYS } from '@/modules/Chat/constants';

/** A frase em que uma ferramenta do agente vira uma linha do chat. */
export type ActivityKey =
  (typeof ACTIVITY_KEYS)[keyof typeof ACTIVITY_KEYS] | 'CHAT.DOING_INSPECT_DESIGN';
