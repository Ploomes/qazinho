import { ASSISTANT_DOCK } from '@/modules/Assistant/constants';

/**
 * Quanto o composer do chat recua à direita para o botão do Estagiário não cobri-lo: o
 * chat vive no painel Agente, então só há espaço a abrir quando esse painel está aberto.
 */
export function dockRoomOf(props: {
  isWorkspace: boolean;
  isPanelOpen: boolean;
}): number {
  if (!props.isWorkspace || !props.isPanelOpen) return 0;

  return ASSISTANT_DOCK.inset + ASSISTANT_DOCK.buttonSize + ASSISTANT_DOCK.rise;
}
