import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';

const PLACEHOLDER = /\$\{([A-Z][A-Z0-9_]*)\}/g;

/**
 * As variáveis que os casos gravados digitam ou conferem, pelo nome, cada uma uma vez, na
 * ordem em que aparecem primeiro.
 */
export function variablesIn(recipes: ICaseRecipe[]): string[] {
  const texts = recipes.flatMap((recipe) =>
    recipe.steps.flatMap(({ actions, proof }) => [
      proof,
      ...actions.flatMap(({ target, value, promptText }) => [
        target,
        value,
        promptText ?? '',
      ]),
    ]),
  );

  return [
    ...new Set(
      texts.flatMap((text) =>
        [...text.matchAll(PLACEHOLDER)].map(([, name]) => name ?? ''),
      ),
    ),
  ];
}
