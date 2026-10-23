/** The message with a token taken out of it, its spaces closed up where the token was. */
export function withoutSecret(props: { text: string; secret: string }): string {
  return props.text
    .split(props.secret)
    .join('')
    .replace(/[ \t]+([,.;:!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
}
