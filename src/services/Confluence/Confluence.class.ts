import type {
  ConfluencePageList,
  ConfluenceSpaceList,
  ConfluenceSwitch,
  IPublishPlan,
  PlanPublished,
} from '@/shared/types';

/** O único que chama o lado do Confluence da bridge. */
export class Confluence {
  public static async turn(isOn: boolean): Promise<ConfluenceSwitch> {
    return (
      (await window.qazinho?.switchConfluence(isOn)) ?? {
        isSwitched: false,
        failure: 'unreachable',
        said: '',
      }
    );
  }

  public static async search(query: string): Promise<ConfluencePageList> {
    return (
      (await window.qazinho?.searchConfluence(query)) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async spaces(): Promise<ConfluenceSpaceList> {
    return (
      (await window.qazinho?.listConfluenceSpaces()) ?? {
        isListed: false,
        failure: 'unreachable',
      }
    );
  }

  public static async publish(plan: IPublishPlan): Promise<PlanPublished> {
    return (
      (await window.qazinho?.publishPlan(plan)) ?? {
        isPublished: false,
        failure: 'unreachable',
        said: '',
      }
    );
  }
}
