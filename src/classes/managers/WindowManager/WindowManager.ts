export class WindowManager {
  private static __instance: WindowManager;

  public static get instance(): WindowManager {
    WindowManager.__instance = WindowManager.__instance || new WindowManager();
    return WindowManager.__instance;
  }

  public get window(): Window & typeof globalThis {
    return typeof window !== 'undefined' ? window : null;
  }
}
