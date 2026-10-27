/**
 * `value` is a share from 0 to 1; `fills` says whether the ring shows what is left or
 * what is used.
 */
export interface IGaugeProps {
  value: number;
  label: string;
  fills?: 'left' | 'used';
}
