/** O que um comando git devolveu: a saída, ou o que o git disse quando recusou. */
export type GitAnswer = { isOk: true; text: string } | { isOk: false; said: string };
