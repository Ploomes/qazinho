import type { IRunSpan } from './IRunSpan';
import type { StepVerdict } from '@/shared/types';

/** Como um passo foi: a nota do agente quando não passou, quando foi andado, e como. */
export interface IRunStep {
  number: number;
  action: string;
  verdict: StepVerdict;
  why: string | null;
  bugId: string | null;
  shot: string | null;
  shotFile: string | null;
  span: IRunSpan | null;
  by?: 'replay' | 'healed';
  proof?: string;
}
