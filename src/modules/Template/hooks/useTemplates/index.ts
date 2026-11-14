import { useEffect } from 'react';
import { Templates } from '@/services';
import { useProStore, useTemplateStore } from '@/store';

export const useTemplates = () => {
  const setTemplates = useTemplateStore((state) => state.setTemplates);
  const setOrgTemplates = useTemplateStore((state) => state.setOrgTemplates);
  const keepOrgs = useTemplateStore((state) => state.keepOrgs);
  const orgs = useProStore((state) =>
    state.status?.isSignedIn === true
      ? state.status.orgs.map(({ slug }) => slug).join(' ')
      : '',
  );

  useEffect(() => {
    void Templates.list().then(setTemplates);
  }, [setTemplates]);

  useEffect(() => {
    const slugs = orgs === '' ? [] : orgs.split(' ');

    keepOrgs(slugs);
    for (const slug of slugs)
      void Templates.listOrg(slug).then((read) => {
        if (read.isListed) setOrgTemplates(read.list);
      });
  }, [orgs, keepOrgs, setOrgTemplates]);
};
