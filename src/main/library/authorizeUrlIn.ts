const URL_IN_TEXT = /https:\/\/\S+/g;

/**
 * O endereço que uma CLI de agente imprimiu para o QA entrar, ou null enquanto ela não
 * imprimiu nenhum.
 */
export function authorizeUrlIn(printed: string): string | null {
  return (
    (printed.match(URL_IN_TEXT) ?? []).find((url) => /oauth|authorize/i.test(url)) ?? null
  );
}
