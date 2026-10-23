import type { IPublishModalProps } from '@/modules/Plan/screens/Plan/components/PublishModal/types';
import type {
  ConfluencePageList,
  ConfluenceSpaceList,
  IConfluencePageRef,
  IConfluenceSpace,
} from '@/shared/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PUBLISH_MODAL } from '@/modules/Plan/screens/Plan/components/PublishModal/constants';
import { CONFLUENCE_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Confluence } from '@/services';

export const usePublishModalViewModel = (props: IPublishModalProps) => {
  const { onCancel, onConfirm } = props;
  const { t } = useTranslation();
  const [spaces, setSpaces] = useState<ConfluenceSpaceList | null>(null);
  const [space, setSpace] = useState<IConfluenceSpace | null>(null);
  const [spaceQuery, setSpaceQuery] = useState('');
  const [parent, setParent] = useState<IConfluencePageRef | null>(null);
  const [parentQuery, setParentQuery] = useState('');
  const [found, setFound] = useState<{ query: string; list: ConfluencePageList } | null>(
    null,
  );
  const [title, setTitle] = useState(props.title);
  const searches = useRef(0);

  const listed = spaces?.isListed === true ? spaces.spaces : [];
  const typed = parentQuery.trim();
  const isSearching = space !== null && parent === null;

  useEffect(() => {
    let isLive = true;

    void Confluence.spaces().then((list) => {
      if (isLive) setSpaces(list);
    });

    return () => {
      isLive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSearching) return;

    const asked = typed;
    const timer = setTimeout(
      () => {
        searches.current += 1;

        const search = searches.current;

        void Confluence.search(asked).then((list) => {
          if (search === searches.current) setFound({ query: asked, list });
        });
      },
      asked === '' ? 0 : PUBLISH_MODAL.debounceMs,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [isSearching, typed]);

  const pages =
    found?.list.isListed === true
      ? found.list.pages.filter((page) => page.space === '' || page.space === space?.name)
      : [];
  const canConfirm = space !== null && title.trim() !== '';

  return {
    title: t('PUBLISH.TITLE'),
    subtitle: t('PUBLISH.SUBTITLE'),
    width: PUBLISH_MODAL.width,
    confirmLabel: t('PUBLISH.CONFIRM'),
    canConfirm,
    spaceLabel: t('PUBLISH.SPACE'),
    space: space === null ? null : { id: space.id, label: space.name, detail: space.key },
    spaceSearch: {
      query: spaceQuery,
      label: t('PUBLISH.PICK_SPACE'),
      placeholder: t('PUBLISH.PICK_SPACE'),
      items: listed.map((one) => ({
        id: one.id,
        label: one.name,
        tag: one.key,
        detail: null,
      })),
      note:
        spaces === null
          ? t('PUBLISH.SPACES_LOADING')
          : !spaces.isListed
            ? t(CONFLUENCE_FAILURE_KEYS[spaces.failure])
            : listed.length === 0
              ? t('PUBLISH.NO_SPACES')
              : null,
      emptyText: t('PUBLISH.NONE_FOUND', { query: spaceQuery.trim() }),
    },
    parentLabel: t('PUBLISH.PARENT'),
    parentNote: t('PUBLISH.PARENT_NOTE'),
    hasParentSearch: space !== null,
    parent: parent === null ? null : { id: parent.id, label: parent.title },
    parentSearch: {
      query: parentQuery,
      label: t('PUBLISH.PICK_PARENT'),
      placeholder: t('PUBLISH.PICK_PARENT'),
      items: pages.map((page) => ({
        id: page.id,
        label: page.title,
        tag: null,
        detail: null,
      })),
      note:
        found?.list.isListed === false
          ? t(CONFLUENCE_FAILURE_KEYS[found.list.failure])
          : found?.query !== typed
            ? t('PUBLISH.PAGES_SEARCHING')
            : null,
      emptyText: t('PUBLISH.NONE_FOUND', { query: typed }),
    },
    pickAnotherLabel: t('PUBLISH.PICK_ANOTHER'),
    titleLabel: t('PUBLISH.PAGE_TITLE'),
    titleValue: title,
    onSpaceQuery: setSpaceQuery,
    onPickSpace: (id: string) => {
      const picked = listed.find((one) => one.id === id);

      if (picked === undefined) return;

      setSpace(picked);
      setParent(null);
      setFound(null);
    },
    onClearSpace: () => {
      setSpace(null);
      setParent(null);
    },
    onParentQuery: setParentQuery,
    onPickParent: (id: string) => {
      const picked = pages.find((page) => page.id === id);

      if (picked !== undefined) setParent(picked);
    },
    onClearParent: () => {
      setParent(null);
    },
    onTitle: setTitle,
    onCancel,
    onConfirm: () => {
      if (space === null || title.trim() === '') return;

      onConfirm({ spaceId: space.id, parentId: parent?.id ?? null, title: title.trim() });
    },
  };
};
