/**
 * `value` é uma fração de 0 a 1; `fills` diz se o anel mostra o que resta ou o que foi
 * usado.
 */
export interface IGaugeProps {
  value: number;
  label: string;
  fills?: 'left' | 'used';
}
