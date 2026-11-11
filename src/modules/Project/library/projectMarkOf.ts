import type { IProjectApp, ProjectMarkShape } from '@/modules/Project/types';

/**
 * Como um projeto aparece ao lado do nome: o ícone do site quando já chegou, senão a
 * plataforma do primeiro alvo, senão a inicial do nome.
 */
export function projectMarkOf(props: {
  name: string;
  app: IProjectApp;
  icons: Record<string, string | null>;
}): ProjectMarkShape {
  const icon = props.app.address === null ? undefined : props.icons[props.app.address];

  if (typeof icon === 'string') return { kind: 'icon', src: icon };
  if (props.app.platform !== null)
    return { kind: 'platform', platform: props.app.platform };

  return { kind: 'initial', initial: props.name.trim().charAt(0).toUpperCase() };
}
