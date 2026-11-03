import type { UpdateFeed } from '@/main/classes/setup/AppUpdater/types';
import { UPDATE_REPO } from '@/main/classes/setup/AppUpdater/constants';

/**
 * O feed que substitui o gravado no app: um endereço de teste, ou o repositório com um
 * token enquanto ele é privado; null para seguir o gravado.
 */
export function updateFeedOf({
  feedUrl,
  token,
}: {
  feedUrl: string | undefined;
  token: string | undefined;
}): UpdateFeed | null {
  if (feedUrl) return { provider: 'generic', url: feedUrl };

  if (token)
    return {
      provider: 'github',
      owner: UPDATE_REPO.owner,
      repo: UPDATE_REPO.name,
      private: true,
      token,
    };

  return null;
}
