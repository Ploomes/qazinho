import type { IOutsideSaved } from '@/main/classes/assistant/OutsideServer/types';

/** O que o arquivo da porta guarda; null para um arquivo que falta ou que não se lê. */
export function outsideSavedOf(text: string): IOutsideSaved | null {
  try {
    const read = JSON.parse(text) as Partial<IOutsideSaved>;

    return typeof read.isOn === 'boolean' &&
      typeof read.port === 'number' &&
      typeof read.token === 'string' &&
      read.token.length > 0
      ? { isOn: read.isOn, port: read.port, token: read.token }
      : null;
  } catch {
    return null;
  }
}
