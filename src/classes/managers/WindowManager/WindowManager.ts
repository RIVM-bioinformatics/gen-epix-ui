export class WindowManager {
  private static __instance: WindowManager;

  private constructor() {
    this.window.managers = this.window.managers || {};
  }

  public static get instance(): WindowManager {
    WindowManager.__instance = WindowManager.__instance || new WindowManager();
    return WindowManager.__instance;
  }

  public get window(): Window & typeof globalThis {
    return globalThis as Window & typeof globalThis;
  }

  public get document(): Document {
    return this.window ? this.window.document : null;
  }

  public get body(): HTMLBodyElement {
    return this.document ? this.document.body as HTMLBodyElement : null;
  }
}
