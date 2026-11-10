import type { ErrorRegion } from './ErrorRegion';
import type { ReactNode } from 'react';

/** A região que a barreira segura e o que ela desenha quando nada quebrou. */
export interface IErrorBarrierProps {
  region: ErrorRegion;
  children: ReactNode;
}
