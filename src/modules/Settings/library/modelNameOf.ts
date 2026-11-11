import type { IModelOption } from '@/modules/Settings/types';

const CLAUDE_ID = /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?(\[[^\]]+\])?$/;

/**
 * Como chamar o modelo em uso: o escolhido, ou o que a própria config do agente nomeia,
 * um id do Claude escrito como gente ("Fable 5.2"); null quando nenhum é conhecido.
 */
export function modelNameOf(props: {
  model: string;
  defaultModel: string | null;
  models: IModelOption[];
}): string | null {
  const { model, defaultModel, models } = props;
  const id = model.length === 0 ? defaultModel : model;

  if (id === null) return null;

  return models.find((option) => option.id === id)?.name ?? readableOf(id);
}

function readableOf(id: string): string {
  const match = CLAUDE_ID.exec(id);

  if (match === null) return id;

  const [, family = '', major = '', minor] = match;
  const name = `${family.charAt(0).toUpperCase()}${family.slice(1)}`;

  return minor === undefined ? `${name} ${major}` : `${name} ${major}.${minor}`;
}
