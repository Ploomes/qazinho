/**
 * Um nome de variável que nenhuma variável do projeto tem: a própria base, ou a base
 * numerada a partir de 2.
 */
export function freeVariableName(props: { base: string; taken: string[] }): string {
  if (!props.taken.includes(props.base)) return props.base;

  for (let number = 2; ; number += 1) {
    const name = `${props.base}_${String(number)}`;

    if (!props.taken.includes(name)) return name;
  }
}
