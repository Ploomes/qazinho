/**
 * O que um alvo é, como uma org pode lê-lo: um endereço web sem login dentro, ou um build
 * pelo nome do arquivo, nunca a pasta em que fica nesta máquina.
 */
export function sharedValueOf(value: string): string {
  if (!/^https?:\/\//i.test(value)) return value.split(/[\\/]/).pop() ?? value;

  try {
    const url = new URL(value);

    if (url.username === '' && url.password === '') return value;

    url.username = '';
    url.password = '';

    return url.toString();
  } catch {
    return value;
  }
}
