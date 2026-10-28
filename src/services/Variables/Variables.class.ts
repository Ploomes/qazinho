import type {
  IApplyVariables,
  IProjectVariables,
  VariablesOutcome,
} from '@/shared/types';

/**
 * O único que chama o lado das variáveis da bridge. Valores entram; só nomes e descrições
 * voltam.
 */
export class Variables {
  public static async list(): Promise<IProjectVariables[]> {
    return (await window.qazinho?.listVariables()) ?? [];
  }

  public static async apply(apply: IApplyVariables): Promise<VariablesOutcome> {
    return (
      (await window.qazinho?.applyVariables(apply)) ?? {
        isSaved: false,
        failure: { reason: 'no-bridge' },
      }
    );
  }

  public static async copy(props: {
    from: string;
    to: string;
  }): Promise<VariablesOutcome> {
    return (
      (await window.qazinho?.copyVariables(props)) ?? {
        isSaved: false,
        failure: { reason: 'no-bridge' },
      }
    );
  }

  public static async forget(projectId: string): Promise<void> {
    await window.qazinho?.forgetVariables(projectId);
  }
}
