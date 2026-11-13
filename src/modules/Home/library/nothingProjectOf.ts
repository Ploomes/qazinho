import type { INewProject, NothingWay } from '@/modules/Home/types';
import { newProjectId } from '@/modules/Project/library';
import { blankWorkspaceOf } from '@/modules/Workspace/library';

/**
 * O projeto de quem não tem nada do app: a loja de exemplo com uma exploração, ou um app
 * que ainda não existe com o plano começando pelo que o QA escreveu.
 */
export function nothingProjectOf(props: {
  way: NothingWay;
  name: string;
  address: string | null;
  text: string;
  now: number;
  words: { web: string; explore: string };
}): INewProject {
  const { way, address, now, words } = props;
  const id = newProjectId(now);
  const isExample = way === 'example' && address !== null;
  const blank = blankWorkspaceOf({
    projectId: id,
    name: isExample ? words.explore : '',
    now,
  });
  const workspace = isExample
    ? { ...blank, targetId: 't-web', planKind: 'web' as const }
    : blank;

  return {
    project: {
      id,
      name: props.name.trim(),
      targets: isExample
        ? [{ id: 't-web', kind: 'web', label: words.web, value: address }]
        : [],
      repositories: [],
    },
    workspaces: [workspace],
    openId: workspace.id,
    starts: [
      isExample
        ? { kind: 'explore', workspaceId: workspace.id }
        : { kind: 'idea', workspaceId: workspace.id, text: props.text.trim() },
    ],
  };
}
