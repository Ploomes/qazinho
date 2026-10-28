/**
 * Como uma run terminou: andou o plano inteiro, o QA a parou, quebrou no caminho, ou o
 * QAzinho fechou debaixo dela.
 */
export type RunEnd = 'finished' | 'stopped' | 'broke' | 'interrupted';
