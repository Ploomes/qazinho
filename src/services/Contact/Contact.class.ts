/** O único que pede à bridge um e-mail para a Salve Software, no app de e-mail do QA. */
export class Contact {
  /** Abre um e-mail para a Salve Software, para o QA terminar e mandar. */
  public static async write(letter: { subject: string; body: string }): Promise<void> {
    await window.qazinho?.writeToSalve(letter);
  }
}
