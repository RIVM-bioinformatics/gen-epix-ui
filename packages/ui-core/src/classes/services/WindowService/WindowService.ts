import {
  container,
  singleton,
} from 'tsyringe';

@singleton()
export class WindowService {
  public get body(): HTMLBodyElement | null {
    const document = this.document;
    return document ? document.body as HTMLBodyElement : null;
  }

  public get document(): Document | null {
    return this.window.document ?? null;
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
