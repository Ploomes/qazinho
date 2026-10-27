/**
 * Before version 1 the model was forced, or reset by a click on the agent, so it goes
 * back to the agent's default.
 */
export function migrateSettings(props: { persisted: unknown; version: number }): unknown {
  const { persisted, version } = props;

  if (version >= 1 || typeof persisted !== 'object' || persisted === null)
    return persisted;

  return { ...persisted, model: '' };
}
