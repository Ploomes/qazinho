/**
 * Um app de celular para olhar: um .apk de Android ou um .app de simulador de iOS, pelo
 * caminho dele.
 */
export interface IPhoneTarget {
  kind: 'android' | 'ios';
  value: string;
}
