/**
 * Um caminho de stream é /<token>/<workspace>; um pedido sem o token desta execução não
 * recebe nada.
 */
export function workspaceOfPath(props: { path: string; token: string }): string | null {
  const [, token, workspace, ...rest] = props.path.split('/');

  if (token !== props.token || !workspace || rest.length > 0) return null;

  try {
    return decodeURIComponent(workspace);
  } catch {
    return null;
  }
}
