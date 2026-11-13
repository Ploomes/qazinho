import type { INameSource, IProject } from '@/modules/Project/types';

/** Onde ler o nome do app de um projeto, na ordem: o site, os builds, o código. */
export function nameSourcesOf(project: IProject): INameSource[] {
  const [repository] = project.repositories;

  return [
    ...project.targets.flatMap((target): INameSource[] =>
      target.kind === 'web'
        ? [{ source: { kind: 'web', address: target.value }, from: 'site' }]
        : [],
    ),
    ...project.targets.flatMap((target): INameSource[] =>
      target.kind === 'web' || target.value === ''
        ? []
        : [{ source: { kind: target.kind, path: target.value }, from: 'build' }],
    ),
    ...(repository === undefined
      ? []
      : [
          {
            source: {
              kind: 'repo' as const,
              owner: repository.owner,
              name: repository.name,
              branch: repository.baseBranch,
            },
            from: 'code' as const,
          },
        ]),
  ];
}
