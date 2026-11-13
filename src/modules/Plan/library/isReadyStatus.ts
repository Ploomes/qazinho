/** Se o status de uma história é um dos que o projeto conta como pronta para teste. */
export function isReadyStatus(props: { status: string; ready: string[] }): boolean {
  const status = props.status.trim().toLowerCase();

  return props.ready.some((name) => name.trim().toLowerCase() === status);
}
