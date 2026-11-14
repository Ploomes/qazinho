/** O id com que o QAzinho guarda um modelo de uma org, distinto de um local. */
export function orgTemplateIdOf(props: { orgSlug: string; id: string }): string {
  return `org:${props.orgSlug}:${props.id}`;
}
