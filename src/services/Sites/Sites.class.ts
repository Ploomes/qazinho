/** O único que pede à bridge o ícone do site de um projeto. */
export class Sites {
  /** O ícone do site de um endereço, como data URL, ou null sem um ou sem a bridge. */
  public static async icon(address: string): Promise<string | null> {
    return (await window.qazinho?.siteIcon(address)) ?? null;
  }

  /** O endereço da loja de exemplo no idioma do QA, ou null quando ela não subiu. */
  public static async exampleShop(language: string): Promise<string | null> {
    return (await window.qazinho?.exampleShop(language)) ?? null;
  }
}
