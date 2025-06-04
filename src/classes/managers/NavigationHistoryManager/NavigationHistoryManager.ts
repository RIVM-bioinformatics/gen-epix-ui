export class NavigationHistoryManager {
  private static __instance: NavigationHistoryManager;
  public readonly navigationHistory: string[] = [];

  public static get instance(): NavigationHistoryManager {
    NavigationHistoryManager.__instance = NavigationHistoryManager.__instance || new NavigationHistoryManager();
    return NavigationHistoryManager.__instance;
  }
}
