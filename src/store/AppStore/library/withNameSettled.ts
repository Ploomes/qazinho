import type { IProject } from '@/modules/Project/types';

/** O projeto salvo, que deixa de esperar o nome do app quando alguém já o renomeou. */
export function withNameSettled(props: {
  before: IProject | undefined;
  after: IProject;
}): IProject {
  const { before, after } = props;

  if (
    after.isNamePending !== true ||
    before === undefined ||
    after.name === before.name
  ) {
    return after;
  }

  const { isNamePending: _pending, ...settled } = after;

  return settled;
}
