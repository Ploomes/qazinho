/** Se dois textos dizem a mesma coisa, sem contar espaços e quebras de linha. */
export function isSameText(props: { before: string; after: string }): boolean {
  return squeezed(props.before) === squeezed(props.after);
}

function squeezed(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
