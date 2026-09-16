/** A browser gocrash started carries its workspace in its profile path, and nothing else does. */
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
