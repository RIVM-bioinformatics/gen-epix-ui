import { HmrUtil } from '../../../utils/HmrUtil';

export class WindowService {
  private static __instance: WindowService;

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

  public static getInstance(): WindowService {
    WindowService.__instance = HmrUtil.getHmrSingleton('windowService', WindowService.__instance, () => new WindowService());
    return WindowService.__instance;
  }
}
