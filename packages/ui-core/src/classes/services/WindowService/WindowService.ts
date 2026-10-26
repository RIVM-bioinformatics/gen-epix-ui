import {
  container,
  singleton,
} from 'tsyringe';

@singleton()
export class WindowService {
  public get body(): HTMLBodyElement {
    return this.document ? this.document.body as HTMLBodyElement : null;
  }

  public get document(): Document {
    return this.window ? this.window.document : null;
  }

  public get window(): typeof globalThis & Window {
    return globalThis as typeof globalThis & Window;
  }

  public static getInstance(): WindowService {
    if (!container.isRegistered(WindowService)) {
      container.registerSingleton(WindowService);
    }
    return container.resolve(WindowService);
  }
}
