/**
 * De onde uma skill veio: criada no QAzinho, deste computador, ou do repositório do time,
 * relida quando o commit da branch muda.
 */
export type SkillSource =
  | { kind: 'created' }
  | { kind: 'computer'; path: string }
  | { kind: 'repo'; repository: string; branch: string; folder: string; commit: string };
