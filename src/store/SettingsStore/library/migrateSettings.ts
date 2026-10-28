/**
 * Antes da versão 1 o modelo era forçado, ou resetado por um clique no agente, então
 * volta ao padrão do agente.
 */
export function migrateSettings(props: { persisted: unknown; version: number }): unknown {
  const { persisted, version } = props;

  if (version >= 1 || typeof persisted !== 'object' || persisted === null)
    return persisted;

  return { ...persisted, model: '' };
}
