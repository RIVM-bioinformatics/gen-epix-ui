import { HmrUtil } from '../../../utils/HmrUtil';

export class WindowManager {
  private static __instance: WindowManager;

  public get body(): HTMLBodyElement {
    return this.document ? this.document.body as HTMLBodyElement : null;
  }

  public get document(): Document {
    return this.window ? this.window.document : null;
  }

  public get window(): typeof globalThis & Window {
    return globalThis as typeof globalThis & Window;
  }

  private constructor() {
    //
  }

  public static getInstance(): WindowManager {
    WindowManager.__instance = HmrUtil.getHmrSingleton('windowManager', WindowManager.__instance, () => new WindowManager());
    return WindowManager.__instance;
  }
}
