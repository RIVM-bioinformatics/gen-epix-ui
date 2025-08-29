export class WindowManager {
  private static __instance: WindowManager;

  public static get instance(): WindowManager {
    WindowManager.__instance = WindowManager.__instance || new WindowManager();
    return WindowManager.__instance;
  }

  public get window(): Window & typeof globalThis {
    return typeof window !== 'undefined' ? window : null;
  }

  public get document(): Document {
    return this.window ? this.window.document : null;
  }

  public get body(): HTMLBodyElement {
    return this.document ? this.document.body as HTMLBodyElement : null;
  }
}
