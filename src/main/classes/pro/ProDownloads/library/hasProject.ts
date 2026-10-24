/** Whether this computer's projects file already holds a project by that id. */
export function hasProject(props: { text: string | null; projectId: string }): boolean {
  if (props.text === null) return false;

  try {
    const projects = JSON.parse(props.text) as unknown;

    return (
      Array.isArray(projects) &&
      projects.some(
        (project: unknown) =>
          typeof project === 'object' &&
          project !== null &&
          (project as { id?: unknown }).id === props.projectId,
      )
    );
  } catch {
    return false;
  }
}
