/**
 * Um navegador que o QAzinho iniciou carrega o workspace dele no caminho do perfil, e
 * nada mais o faz.
 */
export function workspaceOfProfile(props: {
  command: string;
  profileRoot: string;
}): string | null {
  const { command, profileRoot } = props;
  const at = command.indexOf(profileRoot);

  if (at === -1) return null;

  const rest = command.slice(at + profileRoot.length).replace(/^[/\\]/, '');
  const id = rest.split(/[\s/\\]/)[0] ?? '';

  return id.length > 0 ? id : null;
}
