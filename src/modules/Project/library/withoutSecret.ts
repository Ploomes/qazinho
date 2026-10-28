/** A mensagem com um token tirado dela, os espaços fechados onde o token estava. */
export function withoutSecret(props: { text: string; secret: string }): string {
  return props.text
    .split(props.secret)
    .join('')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
}
