import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';

const PLACEHOLDER = /\$\{([A-Z][A-Z0-9_]*)\}/g;

/**
 * The variables recorded cases type or check, by name, each once, in the order they first
 * come.
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
