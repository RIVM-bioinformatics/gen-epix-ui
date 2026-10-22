type HmrSingletonData = Record<string, unknown>;

export class HmrUtil {
  public static getHmrSingleton<T>(key: string, currentInstance: T | undefined, create: () => T): T {
    /* v8 ignore next */
    const hotData = import.meta.hot?.data as HmrSingletonData | undefined;
    const instance = currentInstance || (hotData?.[key] as T | undefined) || create();

    /* v8 ignore next */
    if (hotData) {
      hotData[key] = instance;
    }

    return instance;
  }
}
