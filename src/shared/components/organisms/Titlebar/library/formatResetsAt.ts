/**
 * O agente relata o reset como um segundo unix; um horário no idioma do QA nunca fica
 * velho na tela.
 */
export function formatResetsAt(props: { resetsAt: number; language: string }): string {
  if (props.resetsAt <= 0) return '';

  return new Date(props.resetsAt * 1_000).toLocaleTimeString(props.language, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
