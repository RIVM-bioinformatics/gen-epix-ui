import { HmrUtil } from '../../../utils/HmrUtil';

export class NavigationHistoryManager {
  public static get instance(): NavigationHistoryManager {
    NavigationHistoryManager.__instance = HmrUtil.getHmrSingleton('navigationHistoryManager', NavigationHistoryManager.__instance, () => new NavigationHistoryManager());
    return NavigationHistoryManager.__instance;
  }

  private static __instance: NavigationHistoryManager;

  public readonly navigationHistory: string[] = [];

  private constructor() {
    //
  }
}
