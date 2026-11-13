import type { INewProjectValues, ProjectPick } from '@/modules/Home/types';
import { webAddressOf } from '@/modules/Project/library';
import { projectNameOf } from './projectNameOf';

/**
 * O nome que um projeto novo ganha pelo que o QA deu: o site, o build, o repositório, o
 * espaço da página, o design ou a pasta dos testes; vazio sem nenhum.
 */
export function autoProjectNameOf(props: {
  picks: ProjectPick[];
  values: INewProjectValues;
}): string {
  const { picks, values } = props;
  const address = picks.includes('web') ? webAddressOf(values.web) : null;
  const [build] = picks.includes('build') ? values.builds : [];
  const [repository] = picks.includes('code') ? values.repositories : [];
  const story = picks.includes('story') ? values.story : null;
  const names = [
    address === null ? '' : projectNameOf({ kind: 'web', value: address }),
    build === undefined ? '' : projectNameOf({ kind: build.kind, value: build.path }),
    repository?.name ?? '',
    story?.kind === 'page' ? story.page.space : '',
    picks.includes('design') ? (values.design?.name ?? '') : '',
    picks.includes('tests') ? (values.tests?.name ?? '') : '',
    story?.kind === 'jira' ? (story.issue.key.split('-')[0] ?? '') : '',
  ];

  return names.find((name) => name.trim() !== '')?.trim() ?? '';
}
