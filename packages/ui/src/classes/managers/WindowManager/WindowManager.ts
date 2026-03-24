export class WindowManager {
  private static __instance: WindowManager;

  private constructor() {
    this.window.managers = this.window.managers || {};
  }

  public static get instance(): WindowManager {
    // All other managers store the instance on the window, except this, the WindowManager itself. This is because the WindowManager is responsible for storing the instances of all other managers, so it cannot store itself on the window. Instead, we store the instance in a static property on the class.

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
