import { HmrUtil } from '../../../utils/HmrUtil';

export class NavigationHistoryManager {
  private static __instance: NavigationHistoryManager;

  public readonly navigationHistory: string[] = [];

  private constructor() {
    //
  }

  public static getInstance(): NavigationHistoryManager {
    NavigationHistoryManager.__instance = HmrUtil.getHmrSingleton('navigationHistoryManager', NavigationHistoryManager.__instance, () => new NavigationHistoryManager());
    return NavigationHistoryManager.__instance;
  }
}
