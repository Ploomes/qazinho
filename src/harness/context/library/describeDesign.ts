import type { IHarnessSection } from '@/harness/context/types';
import type { IDesignLink } from '@/shared/types';
import { DESIGN_SECTION } from '@/harness/constants';

/** The Figma design a workspace is checked against, as the agent reads it: the file and the node its link points at. */
export function describeDesign(props: {
  design: IDesignLink | null;
  wasTold: boolean;
}): IHarnessSection {
  const { design } = props;

  if (design === null)
    return {
      title: DESIGN_SECTION.title,
      lines: props.wasTold
        ? ['The workspace has no Figma design any more: plan from the app and the QA.']
        : [],
    };

  return {
    title: DESIGN_SECTION.title,
    lines: [
      `The app is checked against the Figma design "${design.name.replace(/"/g, "'")}": ${design.url}`,
      `fileKey: ${design.fileKey}`,
      design.nodeId === null
        ? 'The link names no node: start from the file’s pages.'
        : `nodeId: ${design.nodeId}, the frame or page the link points at.`,
    ],
  };
}
