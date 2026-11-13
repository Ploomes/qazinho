import type { useNewProjectViewModel } from '@/modules/Home/screens/NewProject/hooks';

/** Os cartões da primeira tela, como o view model da criação os resolveu. */
export type IPickStepProps = ReturnType<typeof useNewProjectViewModel>['pick'];
