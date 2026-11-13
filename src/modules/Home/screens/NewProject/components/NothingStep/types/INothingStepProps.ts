import type { useNewProjectViewModel } from '@/modules/Home/screens/NewProject/hooks';

/** Os dois começos de quem não tem nada, como o view model da criação os resolveu. */
export type INothingStepProps = ReturnType<typeof useNewProjectViewModel>['nothing'];
