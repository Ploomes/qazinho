import type { IProLink } from '@/shared/types';
import { PRO_LINK } from '@/main/constants/PRO_LINK';

/**
 * The plan a `qazinho://open` link from QAzinho Pro names, or null for any other address
 * or one whose org or ids are not names.
 */
export function proLinkOf(address: string): IProLink | null {
  let url: URL;

  try {
    url = new URL(address);
  } catch {
    return null;
  }

  const action = `${url.hostname}${url.pathname}`.replace(/\/+$/, '');

  if (url.protocol !== `${PRO_LINK.scheme}:` || action !== PRO_LINK.action) return null;

  const orgSlug = url.searchParams.get('org') ?? '';
  const projectId = url.searchParams.get('project') ?? '';
  const workspaceId = url.searchParams.get('workspace') ?? '';

  if (
    !PRO_LINK.orgSlug.test(orgSlug) ||
    !PRO_LINK.id.test(projectId) ||
    !PRO_LINK.id.test(workspaceId)
  )
    return null;

  return { orgSlug, projectId, workspaceId };
}
