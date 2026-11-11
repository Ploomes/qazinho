/** Os bytes de um ícone como um data URL, que a página mostra sem buscar nada. */
export function iconDataUrlOf(props: { bytes: Uint8Array; type: string }): string {
  return `data:${props.type};base64,${Buffer.from(props.bytes).toString('base64')}`;
}
