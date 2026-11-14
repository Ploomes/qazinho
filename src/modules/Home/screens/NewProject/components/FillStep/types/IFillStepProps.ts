import type { useNewProjectViewModel } from '@/modules/Home/screens/NewProject/hooks';

/** Os campos da segunda tela, como o view model da criação os resolveu. */
export type IFillStepProps = ReturnType<typeof useNewProjectViewModel>['fill'];
