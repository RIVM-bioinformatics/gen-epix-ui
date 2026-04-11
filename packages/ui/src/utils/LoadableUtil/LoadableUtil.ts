import type { Loadable } from '../../models/dataHooks';

export class LoadableUtil {
  public static findFirstError(loadables: Loadable[]): unknown {
    const loadableWithError = loadables.find(loadable => loadable.isEnabled && loadable.error);
    return loadableWithError?.error;
  }

  public static hasSomeError(loadables: Loadable[]): boolean {
    return loadables.some(loadable => loadable.isEnabled && !!loadable.error);
  }

  public static isAllEnabled(loadables: Loadable[]): boolean {
    return loadables.every(loadable => loadable.isEnabled);
  }

  public static isSomeFetching(loadables: Loadable[]): boolean {
    return loadables.some(loadable => loadable.isEnabled && loadable.isFetching);
  }

  public static isSomeLoading(loadables: Loadable[]): boolean {
    return loadables.some(loadable => loadable.isEnabled && loadable.isLoading);
  }

  public static isSomePending(loadables: Loadable[]): boolean {
    return loadables.some(loadable => loadable.isEnabled && loadable.isPending);
  }
}
