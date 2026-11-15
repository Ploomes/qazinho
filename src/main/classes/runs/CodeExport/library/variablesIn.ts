import type { ICaseRecipe } from '@/main/classes/runs/RunCoordinator/types';

const PLACEHOLDER = /\$\{([A-Z][A-Z0-9_]*)\}/g;

/**
 * As variáveis que os casos gravados digitam ou conferem, o login deles incluído, pelo
 * nome, cada uma uma vez, na ordem em que aparecem primeiro.
 */
export function variablesIn(recipes: ICaseRecipe[]): string[] {
  const texts = recipes.flatMap((recipe) =>
    recipe.steps.flatMap(({ actions, proof, signIn }) => [
      ...(signIn === undefined ? [] : [signIn.proof]),
      ...[...(signIn?.actions ?? []), ...actions].flatMap(
        ({ target, value, promptText }) => [target, value, promptText ?? ''],
      ),
      proof,
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
