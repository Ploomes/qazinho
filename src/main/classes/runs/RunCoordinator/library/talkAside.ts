/** O que o QA disse no meio da run, como o agente o lê junto de uma resposta. */
export function talkAside(texts: string[]): string {
  const said =
    texts.length === 1
      ? `"${texts[0] ?? ''}"`
      : texts.map((text) => `- ${text}`).join('\n');

  return `The QA just told you this while you were working: ${said}\nStop the plan for a moment and check it first, on the device. If it is a bug, file it with bug while the screen shows it. Then call answer_qa with what you checked and what you found. Only then go on with the plan.`;
}
