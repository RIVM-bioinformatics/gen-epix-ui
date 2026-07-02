import { HmrUtil } from '../../../utils/HmrUtil';

export class NavigationHistoryService {
  private static __instance: NavigationHistoryService;

  public readonly navigationHistory: string[] = [];

  private constructor() {
    //
  }

  public static getInstance(): NavigationHistoryService {
    NavigationHistoryService.__instance = HmrUtil.getHmrSingleton('navigationHistoryService', NavigationHistoryService.__instance, () => new NavigationHistoryService());
    return NavigationHistoryService.__instance;
  }
}
