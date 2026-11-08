import type { IBugFlash } from '@/modules/Device/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IStepOutcome } from '@/shared/types';
import { catchBug, isSeenIn } from '@/modules/Bug/library';
import { BUG_FLASH } from '@/modules/Device/constants';

/**
 * O bug que um passo ou achado acabou de pegar, como a tela o mostra; nada quando esta
 * run já o tinha pego, e mais discreto depois dos primeiros dela.
 */
export function bugFlashOf(props: {
  workspace: IWorkspace;
  outcome: IStepOutcome;
  isIncidental: boolean;
}): IBugFlash | null {
  const { workspace, outcome, isIncidental } = props;
  const { live } = workspace;

  if (!live || live.isDone) return null;

  const caught = catchBug({
    workspace,
    outcome,
    outcomes: [...live.outcomes, outcome],
    isIncidental,
  });
  const bug = caught.bugs.find(({ id }) => id === caught.bugId);

  if (caught.how === 'repeat' || bug === undefined) return null;

  return {
    id: `${live.id}/${outcome.caseId}/${String(outcome.stepNumber)}/${String(outcome.at)}`,
    bugId: bug.id,
    shot: outcome.screenshot,
    title: bug.title,
    category: outcome.category ?? null,
    isDesign: outcome.frame !== undefined,
    isSeenAgain: caught.how === 'again',
    box: outcome.box ?? null,
    isQuiet:
      workspace.bugs.filter((one) => isSeenIn({ bug: one, runId: live.id })).length >=
      BUG_FLASH.loudBugs,
  };
}
