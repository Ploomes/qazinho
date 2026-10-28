/** Em que o replay abre: a run inteira, a gravação de um caso, ou o momento de um bug. */
export type ReplayFocus =
  { kind: 'run' } | { kind: 'case'; caseId: string } | { kind: 'bug'; bugId: string };
