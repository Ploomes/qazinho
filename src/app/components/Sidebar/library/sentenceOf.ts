/** Um texto começando em maiúscula, como uma frase, no idioma do QA. */
export function sentenceOf(props: { text: string; language: string }): string {
  return `${props.text.charAt(0).toLocaleUpperCase(props.language)}${props.text.slice(1)}`;
}
