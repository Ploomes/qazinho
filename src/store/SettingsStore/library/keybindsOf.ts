import type { IKeybind } from '@/modules/Settings/types';

/**
 * Os atalhos como a tabela os nomeia, cada um nas teclas que o QA escolheu para ele: um
 * rótulo salvo nunca volta.
 */
export function keybindsOf(props: { saved: unknown; table: IKeybind[] }): IKeybind[] {
  const saved = Array.isArray(props.saved) ? (props.saved as unknown[]) : [];

  return props.table.map((keybind) => {
    const combo = comboOf({ saved, id: keybind.id });

    return combo === null ? keybind : { ...keybind, combo };
  });
}

function comboOf(props: { saved: unknown[]; id: string }): string | null {
  for (const one of props.saved) {
    if (typeof one !== 'object' || one === null) continue;

    const { id, combo } = one as { id?: unknown; combo?: unknown };

    if (id === props.id && typeof combo === 'string') return combo;
  }

  return null;
}
