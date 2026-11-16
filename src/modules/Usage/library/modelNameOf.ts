const FAMILIES = ['opus', 'sonnet', 'haiku', 'fable'];

/**
 * O nome curto de um modelo do Claude ("claude-sonnet-5-5" vira "Sonnet 5.5"), qualquer
 * outro como veio, e null para o modelo padrão do agente.
 */
export function modelNameOf(model: string): string | null {
  if (model.trim() === '') return null;

  const parts = model
    .toLowerCase()
    .replace(/-\d{8}$/, '')
    .split('-');
  const family = parts.find((part) => FAMILIES.includes(part));

  if (parts[0] !== 'claude' || family === undefined) return model;

  const version = parts.filter((part) => /^\d+$/.test(part)).join('.');
  const name = `${family.charAt(0).toUpperCase()}${family.slice(1)}`;

  return version === '' ? name : `${name} ${version}`;
}
